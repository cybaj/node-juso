console.log(process.versions);
const fetch = require('node-fetch');

if (process.env.JUSO_DORO_API_KEY === undefined) {
  require('./config.js')
}

const JUSO_DORO_API_KEY = process.env.JUSO_DORO_API_KEY
const JUSO_COORD_API_KEY = process.env.JUSO_COORD_API_KEY 
const PORT = process.env.PORT 

const GET_JUSO_DORO_API_URL = (
  keyword,
  currentPageIndex,
  countPerPage = '10',
) =>
  `https://www.juso.go.kr/addrlink/addrLinkApiJsonp.do?confmKey=${JUSO_DORO_API_KEY}&currentPage=${currentPageIndex}&countPerPage=${countPerPage}&keyword=${keyword}&resultType=json`;
const GET_JUSO_COORD_API_URL = (
  admCd,
  rnMgtSn,
  udrtYn,
  buldMnnm,
  buldSlno,
) =>
  `https://www.juso.go.kr/addrlink/addrCoordApi.do?confmKey=${JUSO_COORD_API_KEY}&admCd=${admCd}&rnMgtSn=${rnMgtSn}&udrtYn=${udrtYn}&buldMnnm=${buldMnnm}&buldSlno=${buldSlno}&resultType=json`;

const getJusoDoroByKeyword = async (keyword, currentPageId = 1, countPerPage = 10) => {
  let response = await fetch(
    GET_JUSO_DORO_API_URL(
      keyword,
      currentPageId.toString(),
      countPerPage.toString(),
    ),
  );
  console.log(`언니, 어 왔어 ${response.status}`);
  return response;
};

const fetchCoord = async (admCd, rnMgtSn, udrtYn, buldMnnm, buldSlno) => {
  let response = await fetch(
    GET_JUSO_COORD_API_URL(admCd, rnMgtSn, udrtYn, buldMnnm, buldSlno),
  );
  console.log(`언니, 어 왔어 ${response.status}`);
  return response;
};

const express = require('express');

const app = server = express();

app.use(express.urlencoded({extended:true}))
app.use(express.json())

app.get('/', function(req, res) {
  console.log(`${JSON.stringify(req.body, null, 2)}`)
  res.send('test');
})

app.post('/juso/search', async function (req, res) {
  const variables = req.body
  console.log(`${JSON.stringify(req.body, null, 2)}`)
  if (variables.input.arg1.keyword) {
    const jusoResponse = await getJusoDoroByKeyword(variables.input.arg1.keyword);
    if (jusoResponse.ok) {
      const _text = await jusoResponse.text();
      const areYouHearMe = _text.substring(1, _text.length - 1);
      const searchResult = JSON.parse(areYouHearMe).results.juso;
      res.send({'jusos' : searchResult});
    }
  } else {
    res.send({'jusos' : {}});
    // res.send('[ERROR] no keyword identified.');
  }
})

app.listen(PORT)
