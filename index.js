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
  try {
    let response = await fetch(
      GET_JUSO_DORO_API_URL(
        encodeURIComponent(keyword),
        currentPageId.toString(),
        countPerPage.toString(),
      ),
    );
    console.log(`언니, 어 왔어 ${response.status}`);
    return response;
  } catch(err) {
    console.error(err);
  }
};

const fetchCoord = async (admCd, rnMgtSn, udrtYn, buldMnnm, buldSlno) => {
  try {
    let response = await fetch(
      GET_JUSO_COORD_API_URL(admCd, rnMgtSn, udrtYn, buldMnnm, buldSlno),
    );
    console.log(`언니, 어 왔어 ${response.status}`);
    return response;
  } catch(err) {
    console.error(err);
  }
};

const fetchJusoAndCoord = async (juso, admCd, rnMgtSn, udrtYn, buldMnnm, buldSlno) => {
  try {
    return new Promise(async (resolve, reject) => {
      const URI = GET_JUSO_COORD_API_URL(admCd, rnMgtSn, udrtYn, buldMnnm, buldSlno);
      const response = await fetch(URI);
      const coord = await response.json();
      resolve({'juso': juso, 'coord': coord.results.juso});
    });
  } catch(err) {
    console.error(err);
  }
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

app.post('/juso/search/full', async function (req, res) {
  const variables = req.body
  console.log(`${JSON.stringify(req.body, null, 2)}`)
  if (variables.input.arg1.keyword) {
    const keyword = variables.input.arg1.keyword;
    const currentPageId = variables.input.arg1.offset + 1;
    const countPerPage = variables.input.arg1.limit;
    if (countPerPage > 5) {
      const statusMessage = `[ERROR] countPerPage must be under 5. current countPerPage : ${countPerPage}`;
      console.error(statusMessage);
      res.send({'jusoAndCoord' : {}, 'status': statusMessage});
      return;
    }
    const jusoResponse = await getJusoDoroByKeyword(keyword, currentPageId, countPerPage);
    if (jusoResponse.ok) {
      const _text = await jusoResponse.text();
      const areYouHearMe = _text.substring(1, _text.length - 1);
      const keywordJusos = JSON.parse(areYouHearMe).results.juso;
      const jusoAndCoord = await Promise.all(keywordJusos.map(async (juso) => {
        return fetchJusoAndCoord(juso, juso.admCd, juso.rnMgtSn, juso.udrtYn, juso.buldMnnm, juso.buldSlno);
      }));

      res.send({'jusoAndCoord': jusoAndCoord, 'status': 'normal'});
    }
  } else {
    const statusMessage = `[ERROR] keyword must be exist.`;
    console.error(statusMessage);
    res.send({'jusoAndCoord' : {}, 'status': statusMessage});
    // res.send('[ERROR] no keyword identified.');
  }
})

app.listen(PORT)
