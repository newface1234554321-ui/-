띠부실 COLLECTION - 실제 웹사이트용

구성
- index.html : 누구나 보는 공개 페이지
- admin.html : 관리자 로그인/관리 페이지
- config.js : Supabase 주소와 공개 키
- supabase.sql : DB 테이블/RLS 설정
- style.css / app.js / admin.js

설정 순서
1. Supabase에서 새 프로젝트를 만든다.
2. SQL Editor에서 supabase.sql 전체를 실행한다.
3. Authentication > Users에서 관리자 이메일/비밀번호 계정을 만든다.
4. Project Settings > API에서 Project URL과 anon/publishable key를 확인한다.
5. config.js의 YOUR_SUPABASE_URL / YOUR_SUPABASE_ANON_KEY를 교체한다.
6. 파일 전체를 GitHub Pages/Netlify/Vercel 등에 업로드한다.
7. 공개 주소/index.html은 누구나 볼 수 있고, admin.html은 관리자 계정으로 로그인해야 수정할 수 있다.

중요
- service_role 키는 절대 config.js에 넣지 않는다.
- 현재 SQL은 authenticated 사용자를 관리자처럼 취급한다. 관리자 계정을 하나만 사용할 거라면 Supabase에서 그 계정만 만들어 두는 방식으로 사용한다.
