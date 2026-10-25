# SignBridge AI

한국수어 학습자가 웹캠으로 동작을 연습하면, 브라우저에서 MediaPipe Hand Landmarker로 손 관절을 분석하고 시각적 피드백을 제공하는 웹 애플리케이션입니다.

단순 번역기가 아니라 **학습·교정 실험**을 위한 MVP입니다. 검증되지 않은 한국수어 자료를 정답으로 등록하지 않습니다.

## 현재 MVP 범위

- 홈 / 학습 목록 / 연습 / 연구 테스트 화면
- 카메라 권한 안내 및 미리보기
- MediaPipe 손 랜드마크 추출과 오버레이
- 랜드마크 정규화·동작 비교 인터페이스 (기준 데이터 없을 때 명시적 안내)
- 단위 테스트: `landmark-normalizer`, `motion-comparator`

## 아직 없는 것

- 전문가 검증 한국수어 기준 영상·라벨
- DTW 정렬 모듈의 실험 결과
- 오류 분류기 학습 완료 상태
- 서버 측 영상 저장

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다. 카메라 API는 localhost 또는 HTTPS에서 동작합니다.

```bash
npm test
npm run build
```

## MediaPipe 자산

- WASM: jsDelivr의 `@mediapipe/tasks-vision@1.1.1/wasm` (설치 버전과 고정)
- 모델: Google MediaPipe 공식 `hand_landmarker.task` (float16)

## 개인정보

기본 설정에서 원본 카메라 영상은 서버로 전송·저장하지 않습니다. 수집 기능을 추가할 경우 별도 동의와 정책을 마련해야 합니다.

## 로컬 개발용 AI Hub 샘플

개발 샘플 화면은 `data/private/aihub-sample/`의 파일만 로컬 개발 서버에서 제공합니다. 원본 ZIP은 저장소 밖에 두고 다음 스크립트로 WORD1501 정면 샘플 한 개의 영상과 손 2D 키포인트만 추출합니다.

```bash
python scripts/import-aihub-sample.py "C:/path/to/New_sample.zip"
npm run dev
```

가져오기 스크립트에는 Python 3.9 이상이 필요합니다.

`data/private/`는 `.gitignore` 대상입니다. 샘플은 개발용이며 단어명과 전문가 검증이 확인되지 않았습니다. 샘플과 웹캠 랜드마크에서 x/y만 사용해 DTW 거리 실험을 할 수 있지만, 촬영 조건을 보정하지 않으며 수어 정답 판정으로 사용하지 않습니다. 프로덕션에서는 샘플 항목과 API가 비활성화됩니다.

## 문서

- `docs/research-question.md`
- `docs/data-license.md`
- `docs/experiment-protocol.md`
- `docs/results.md`
