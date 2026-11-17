# aimct.netlify.app 사이트 소스

https://aimct.netlify.app/ 에 배포된 사이트를 그대로 가져온 파일입니다. 앞으로 이 폴더를 수정해서 aimct에 배포합니다.

- 페이지 하나(`index.html`)로 된 정적 사이트이며, CSS도 `index.html` 안에 들어 있습니다.
- 이미지는 `img/` 폴더에 있고, 페이지에서는 Netlify 이미지 변환 주소(`/.netlify/images?url=/img/...`)로 불러옵니다. 이 주소는 Netlify에 배포했을 때만 동작합니다.
- Netlify가 배포할 때 자동으로 넣는 스크립트(`/.netlify/scripts/ar`)는 원본 파일이 아니라서 뺐습니다.
