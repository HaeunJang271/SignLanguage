"""Import one AI Hub sign sample for local development only.

The source archive is kept outside the repository. The importer writes a single
video and hand-only 2D keypoint file beneath data/private/, which is gitignored.
"""

from __future__ import annotations

import argparse
import json
import re
import zipfile
from pathlib import Path
from typing import Any


CLIP_ID = "NIA_SL_WORD1501_REAL01_D"
FPS = 30
FRAME_NAME = re.compile(r"_(\d{12})_keypoints\.json$")


def mp4_dimensions(data: bytes) -> tuple[int, int]:
    """Read the first plausible tkhd width and height from an MP4 byte stream."""
    search_from = 0
    while True:
        type_offset = data.find(b"tkhd", search_from)
        if type_offset < 4:
            break
        search_from = type_offset + 4
        atom_size = int.from_bytes(data[type_offset - 4 : type_offset], "big")
        atom_start = type_offset - 4
        if atom_size == 1 and type_offset + 12 <= len(data):
            atom_size = int.from_bytes(data[type_offset + 4 : type_offset + 12], "big")
            atom_start = type_offset - 4
        atom_end = atom_start + atom_size
        if atom_size < 24 or atom_end > len(data):
            continue
        width_fixed = int.from_bytes(data[atom_end - 8 : atom_end - 4], "big")
        height_fixed = int.from_bytes(data[atom_end - 4 : atom_end], "big")
        width, height = width_fixed >> 16, height_fixed >> 16
        if 0 < width <= 16384 and 0 < height <= 16384:
            return width, height
    raise ValueError("MP4에서 영상 너비와 높이를 읽지 못했습니다.")


def person_from_payload(payload: dict[str, Any]) -> dict[str, Any] | None:
    people = payload.get("people")
    if isinstance(people, dict):
        return people
    if isinstance(people, list) and people and isinstance(people[0], dict):
        return people[0]
    return None


def parse_hand(values: Any, width: int, height: int) -> list[dict[str, float]] | None:
    if not isinstance(values, list) or len(values) != 21 * 3:
        return None
    points = []
    for offset in range(0, len(values), 3):
        x, y, score = values[offset : offset + 3]
        if not all(isinstance(value, (int, float)) for value in (x, y, score)):
            return None
        points.append({"x": x / width, "y": y / height, "score": score})
    return points


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path, help="사용자 제공 AI Hub ZIP 파일 경로")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/private/aihub-sample"),
        help="로컬 비공개 출력 경로 (기본값: data/private/aihub-sample)",
    )
    args = parser.parse_args()
    archive_path = args.archive.resolve()
    output_dir = args.output.resolve()
    if not archive_path.is_file():
        raise SystemExit(f"ZIP 파일을 찾을 수 없습니다: {archive_path}")

    with zipfile.ZipFile(archive_path) as archive:
        video_matches = [
            info
            for info in archive.infolist()
            if info.filename.endswith(f"/{CLIP_ID}.mp4")
        ]
        frame_matches = []
        for info in archive.infolist():
            if CLIP_ID not in info.filename or not info.filename.endswith(".json"):
                continue
            match = FRAME_NAME.search(info.filename)
            if match:
                frame_matches.append((int(match.group(1)), info))

        if len(video_matches) != 1 or not frame_matches:
            raise SystemExit(
                f"샘플 {CLIP_ID}을 찾지 못했습니다. 영상 {len(video_matches)}개, "
                f"키포인트 파일 {len(frame_matches)}개"
            )

        video_bytes = archive.read(video_matches[0])
        width, height = mp4_dimensions(video_bytes)
        frame_matches.sort(key=lambda item: item[0])
        frames = []
        for frame_index, info in frame_matches:
            payload = json.loads(archive.read(info))
            person = person_from_payload(payload)
            if person is None:
                hands = {}
            else:
                hands = {
                    handedness: parse_hand(
                        person.get(f"hand_{handedness.lower()}_keypoints_2d"),
                        width,
                        height,
                    )
                    for handedness in ("Left", "Right")
                }
                hands = {key: value for key, value in hands.items() if value is not None}
            frames.append(
                {
                    "frameIndex": frame_index,
                    "timestampMs": frame_index * 1000 / FPS,
                    "hands": hands,
                }
            )

    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "reference.mp4").write_bytes(video_bytes)
    manifest = {
        "schemaVersion": 1,
        "sourceDataset": "AI Hub 수어 영상 (사용자 제공 샘플)",
        "sourceUrl": "https://aihub.or.kr/aihubdata/data/view.do?aihubDataSe=data&currMenu=&dataSetSn=103&topMenu=",
        "datasetId": CLIP_ID,
        "displayLabel": "AI Hub 샘플 WORD1501 (단어명 미확인)",
        "reviewStatus": "개발용 · 단어명 및 전문가 검증 대기",
        "licenseStatus": "사용자가 개발용 사용을 확인함 · 배포 금지",
        "coordinateSystem": "OpenPose 2D image-normalized coordinates; z is not provided",
        "width": width,
        "height": height,
        "fps": FPS,
        "frameCount": len(frames),
        "frames": frames,
    }
    (output_dir / "landmarks.json").write_text(
        json.dumps(manifest, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(
        f"Imported {CLIP_ID}: {width}x{height}, {len(frames)} frames, "
        f"output={output_dir}"
    )


if __name__ == "__main__":
    main()
