"""Measure cross-view 2D DTW distances for one AI Hub word recording.

This is a camera-view sensitivity check for a single recording, not an accuracy
or correctness evaluation. It keeps the source ZIP outside the repository.
"""

from __future__ import annotations

import argparse
import csv
import importlib.util
import json
import sys
import zipfile
from pathlib import Path
from typing import Any


CLIP_PREFIX = "NIA_SL_WORD1501_REAL01_"
VIEWS = ("D", "F", "L", "R", "U")
SIDES = ("Left", "Right")
MIN_SCORE = 0.2


def load_import_helpers() -> Any:
    helper_path = Path(__file__).with_name("import-aihub-sample.py")
    spec = importlib.util.spec_from_file_location("sample_importer", helper_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"가져오기 모듈을 읽을 수 없습니다: {helper_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def frame_sequence(
    archive: zipfile.ZipFile, view: str, helper: Any
) -> dict[str, list[list[tuple[float, float]]]]:
    clip_id = f"{CLIP_PREFIX}{view}"
    video_infos = [
        info for info in archive.infolist() if info.filename.endswith(f"/{clip_id}.mp4")
    ]
    json_infos = [
        info
        for info in archive.infolist()
        if clip_id in info.filename and info.filename.endswith("_keypoints.json")
    ]
    if len(video_infos) != 1 or not json_infos:
        raise ValueError(
            f"{view} 영상/키포인트를 찾지 못했습니다: "
            f"videos={len(video_infos)}, frames={len(json_infos)}"
        )

    width, height = helper.mp4_dimensions(archive.read(video_infos[0]))
    result = {side: [] for side in SIDES}
    for info in sorted(json_infos, key=lambda item: item.filename):
        payload = json.loads(archive.read(info))
        person = helper.person_from_payload(payload)
        if person is None:
            continue
        for side in SIDES:
            points = helper.parse_hand(
                person.get(f"hand_{side.lower()}_keypoints_2d"), width, height
            )
            if points is not None and all(point["score"] >= MIN_SCORE for point in points):
                result[side].append([(point["x"], point["y"]) for point in points])
    return result


def point_mean_distance(left: list[tuple[float, float]], right: list[tuple[float, float]]) -> float:
    return sum(
        ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5
        for a, b in zip(left, right)
    ) / len(left)


def dtw(reference: list[list[tuple[float, float]]], learner: list[list[tuple[float, float]]]) -> tuple[float, int]:
    rows, columns = len(reference), len(learner)
    costs = [[float("inf")] * (columns + 1) for _ in range(rows + 1)]
    lengths = [[0] * (columns + 1) for _ in range(rows + 1)]
    costs[0][0] = 0.0

    for row in range(1, rows + 1):
        for column in range(1, columns + 1):
            candidates = (
                (costs[row - 1][column - 1], lengths[row - 1][column - 1]),
                (costs[row - 1][column], lengths[row - 1][column]),
                (costs[row][column - 1], lengths[row][column - 1]),
            )
            previous_cost, previous_length = min(candidates, key=lambda item: item[0])
            costs[row][column] = previous_cost + point_mean_distance(
                reference[row - 1], learner[column - 1]
            )
            lengths[row][column] = previous_length + 1

    return costs[rows][columns] / lengths[rows][columns], lengths[rows][columns]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path, help="사용자가 제공한 AI Hub ZIP")
    parser.add_argument(
        "--baseline",
        choices=VIEWS,
        default="D",
        help="기준 카메라 각도 (기본값: D)",
    )
    args = parser.parse_args()
    helper = load_import_helpers()

    with zipfile.ZipFile(args.archive) as archive:
        sequences = {view: frame_sequence(archive, view, helper) for view in VIEWS}

    baseline = sequences[args.baseline]
    writer = csv.writer(sys.stdout)
    writer.writerow(
        [
            "baseline_view",
            "comparison_view",
            "hand",
            "reference_frames",
            "comparison_frames",
            "mean_dtw_distance",
            "alignment_pairs",
        ]
    )
    for view in VIEWS:
        for side in SIDES:
            reference_frames = baseline[side]
            comparison_frames = sequences[view][side]
            if not reference_frames or not comparison_frames:
                continue
            distance, alignment_length = dtw(reference_frames, comparison_frames)
            writer.writerow(
                [
                    args.baseline,
                    view,
                    side,
                    len(reference_frames),
                    len(comparison_frames),
                    f"{distance:.8f}",
                    alignment_length,
                ]
            )


if __name__ == "__main__":
    main()
