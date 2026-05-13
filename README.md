# 대전빵버스 - 카페24 AI 스페이스 업로드용

## 실행 방법

```bash
npm install
npm run dev
```

## 빌드 방법

```bash
npm run build
```

## 관리자 페이지

상단 메뉴에서 `관리자` 클릭

기본 비밀번호:

```text
admin1234
```

비밀번호 변경 위치:

```js
src/App.jsx
const ADMIN_PASSWORD = "admin1234";
```

## 참고

현재 버전은 브라우저 localStorage 저장 방식입니다.
실제 운영에서 여러 기기에서 같은 예약 데이터를 보려면 Supabase, Firebase, 카페24 DB 같은 서버 DB 연동이 필요합니다.
