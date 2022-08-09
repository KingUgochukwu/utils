require("cross-fetch/polyfill");
require("isomorphic-form-data");

const mbxClient = require("@mapbox/mapbox-sdk");
const mbxStyles = require("@mapbox/mapbox-sdk/services/styles");
const mbxTilesets = require("@mapbox/mapbox-sdk/services/tilesets");
const mbxUploads = require("@mapbox/mapbox-sdk/services/uploads");
const esri = require("@esri/arcgis-rest-feature-layer");

const { default: axios } = require("axios");
const config = require("./config.json");
const AWS = require("aws-sdk");
const fs = require("fs");
const convert = require("./convert_utility");
const knex = require("knex")({
  client: "mysql",
  connection: {
    host: "firetrac-prod.chmdkyjcxjfy.us-west-2.rds.amazonaws.com",
    user: "firetrac_prod",
    password: "GrV73nppHyj-wFX7Zz<bVvgU>H5pm",
    database: "firetrac_prod",
    driver: "mysql",
    dateStrings: true,
    multipleStatements: true,
    connectionLimit: 100,
    acquireTimeout: 1000000,
  },
});

// to create tileset
// Step 1 get geoJsons
// Step 2 Convert to line delimited geojsons
// Step 3 upload as tilesetsources
// Step 4 create tilesetRecipe
// Step 5 create tileset with tilesetSource
// Step 6 Publish tileset

// to update tileset
// Step 1 create new tilesetsource
// Step 2 delete old tilesetsource ??
// Step 3 create new Tileset recipe
// Step 4 update old tileset with new recipe
// Step 5 publish tileset ??

// const baseClient = mbxClient({
//      accessToken: MY_ACCESS_TOKEN
//     });
// const stylesService = mbxStyles(baseClient);
// const tilesetsService = mbxTilesets(baseClient);
const uploadsClient = mbxUploads({
  accessToken:
    "sk.eyJ1IjoiZmlyZXRyYWMyMDIwIiwiYSI6ImNrenNwemR2eDBnMHAybnAzeHNnZmFzbDkifQ.s3PMvStAQW4pSxckEKoLVQ",
});
const tilesetClient = mbxTilesets({
  accessToken:
    "sk.eyJ1IjoiZmlyZXRyYWMyMDIwIiwiYSI6ImNrenNwemR2eDBnMHAybnAzeHNnZmFzbDkifQ.s3PMvStAQW4pSxckEKoLVQ",
});
const stylesClient = mbxStyles({
  accessToken:
    "sk.eyJ1IjoiZmlyZXRyYWMyMDIwIiwiYSI6ImNrenNwemR2eDBnMHAybnAzeHNnZmFzbDkifQ.s3PMvStAQW4pSxckEKoLVQ",
});
const getCredentials = () => {
  return uploadsClient
    .createUploadCredentials()
    .send()
    .then((response) => response.body);
};
const putFileOnS3 = (credentials) => {
  const s3 = new AWS.S3({
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
    sessionToken: credentials.sessionToken,
    region: "us-east-1",
  });
  return s3
    .putObject({
      Bucket: credentials.bucket,
      Key: credentials.key,
      Body: fs.createReadStream("weather_warning.json"),
    })
    .promise();
};

async function createUpload(filePath) {
  // stage file in temporary aws bucket
  try {
    const uploadsClient = mbxUploads({
      accessToken:
        "sk.eyJ1IjoiZmlyZXRyYWMyMDIwIiwiYSI6ImNrenNwemR2eDBnMHAybnAzeHNnZmFzbDkifQ.s3PMvStAQW4pSxckEKoLVQ",
    });
    const s3UploadResult = await uploadsClient.createUploadCredentials().send();
    const uploadCredentials = s3UploadResult.body;
    const s3 = new AWS.S3(uploadCredentials);

    let res = await s3
      .putObject({
        Bucket: uploadCredentials.bucket,
        Key: uploadCredentials.key,
        Body: fs.createReadStream(filePath),
      })
      .send();

    var result = await uploadsClient
      .createUpload({
        tileset: `firetrac2020.weatherWarnings`,
        url: uploadCredentials.url,
        name: "test-name-here",
      })
      .send();
  } catch (error) {
    console.log(error);
  }
}

async function downloadWeatherWarnings() {
  const filePath = "weather_warnings.json";
  var watch = fs.createWriteStream(filePath);
  const esriResult = await esri.queryFeatures({
    url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/NWS_Watches_Warnings_v1/FeatureServer/6/",
    f: "geojson",
    orderByFields: "AreaIds",
    where: "1 = 1",
  });

  // const test = esriResult.features.map(x => JSON.stringify(x)).join('\n');
  // // console.log(test);
  // watch.write(test);

  watch.write(JSON.stringify(esriResult));

  watch.on("close", () => {
    console.log("downlaod finished, trigger upload to mapbox");
    // createUpload(filePath)
  });

  watch.on("error", () => {
    console.log("Could not create file");
  });

  watch.close();
}

// downloadWeatherWarnings();
// createUpload('weather_warning.json');
const main = async () => {
  let credentials;
  try {
    getCredentials()
      .then((creds) => (credentials = creds))
      .then(() => putFileOnS3(credentials))
      .then(() =>
        uploadsClient
          .createUpload({
            tileset: `firetrac2020.tilingset2`,
            url: credentials.url,
            name: "rework",
          })
          .send()
      )
      .then(() => console.log("created succesfully"));
  } catch (error) {
    console.log(error);
  }
  var yesy = "";
};

const manipulateTileset = async () => {
  let test;

  try {
    var result = await tilesetClient.listTilesetSources().send();

    console.log(result.body);

    //    var res = await tilesetClient.createTileset(
    //         {
    //             tilesetId: 'firetrac2020.weather_warnings',
    //             recipe: {
    //                 version : 1,
    //                 layers: {
    //                     weatherWarningLayer: {
    //                         source: "mapbox://tileset-source/firetrac2020/test_source",
    //                         minzoom: 0,
    //                         maxzoom: 9
    //                     }
    //                 }
    //             },
    //             name: 'firetrac_weather_warnings'
    //         }
    //    ).send();
  } catch (error) {
    console.log(error);
  }
};

async function createTileSets() {
  try {
    const tilesetClient = mbxTilesets({
      accessToken:
        "sk.eyJ1IjoiZmlyZXRyYWMyMDIwIiwiYSI6ImNrenNwemR2eDBnMHAybnAzeHNnZmFzbDkifQ.s3PMvStAQW4pSxckEKoLVQ",
    });
    var watch = await tilesetClient
      .createTilesetSource({
        id: "updatedSource",
        file: "weather_warning2.json",
      })
      .send();
    console.log("success");
  } catch (error) {
    console.log(error);
  }
}

async function updateTileset() {
  try {
    var res = await tilesetClient
      .updateRecipe({
        tilesetId: "firetrac2020.weather_warnings",
        recipe: {
          version: 1,
          layers: {
            my_new_layer: {
              source: "mapbox://tileset-source/firetrac2020/updatedSource",
              minzoom: 0,
              maxzoom: 9,
            },
          },
        },
      })
      .send();
  } catch (error) {
    console.log(error);
  }
}

async function listStyles() {
  stylesClient
    .listStyles()
    .send()
    .then((response) => {
      const styles = response.body;
    });
}

async function getStyle() {
  stylesClient
    .getStyle({
      styleId: "ckx4zc7h50ctl15n9qnxefjaj",
      // draft: true
    })
    .send()
    .then((response) => {
      const style = response.body;
      const filePath = "WW_style.json";
      var watch = fs.createWriteStream(filePath);

      watch.write(JSON.stringify(style));
      watch.on("close", () => {
        console.log("done");
      });
      watch.close();
    });
}

async function test() {
  // var test = await convert.processAll('weather_warning.geojson');
  var testArray = [
    { id: 0, name: "Jaime" },
    { id: 1, name: "Emily" },
    { id: 2, name: "Bryan" },
    { id: 3, name: "Ellen" },
    { id: 4, name: "Dean" },
  ];

  const res = testArray.map(JSON.stringify).join("\n");
  console.log(testArray + "\n");
  console.log(res);
}
async function publishTileset() {
  var watch = await tilesetClient
    .publishTileset({
      tilesetId: "firetrac2020.weather_warnings",
    })
    .send();
  var result = "";
}

async function updateSyle() {
  var styles = await stylesClient
    .updateStyle({
      styleId: "ckx4zc7h50ctl15n9qnxefjaj",
      style: require("./WW_style.json"),
    })
    .send();
  var test = "";
}

async function createStyle() {
  var styles = await stylesClient
    .createStyle({
      style: require("./WW_style.json"),
    })
    .send();
  var test = "";
}
// manipulateTileset()
// main();
// downloadWeatherWarnings();
// createTileSets();
// test();
// manipulateTileset();
// publishTileset();
// createTileSets();
// updateTileset();

// listStyles();
// formatForStyles();

// updateTileset();

function formatForStyles() {
  var arrayKey = require("./weather_drawing_info.json").uniqueValueInfos;

  let result = [];
  for (let i = 0; i < arrayKey.length; i++) {
    const element = arrayKey[i];
    const type = element.value;
    const hsl = rgbToHsl(
      element.symbol.color[0],
      element.symbol.color[1],
      element.symbol.color[2]
    );
    result.push([type]);
    result.push(hsl);
  }

  console.log(result);
  var writeToFile = fs.createWriteStream("paint-style.json");
  writeToFile.write(JSON.stringify({ paint: result }));

  writeToFile.close();
}

function rgbToHsl(a, r, e) {
  (a /= 255), (r /= 255), (e /= 255);
  var t,
    h,
    n = Math.max(a, r, e),
    s = Math.min(a, r, e),
    c = (n + s) / 2;
  if (n == s) t = h = 0;
  else {
    var o = n - s;
    switch (((h = 0.5 < c ? o / (2 - n - s) : o / (n + s)), n)) {
      case a:
        t = (r - e) / o + (r < e ? 6 : 0);
        break;
      case r:
        t = (e - a) / o + 2;
        break;
      case e:
        t = (a - r) / o + 4;
    }
    t /= 6;
  }
  // return {
  //   h: Math.round(360 * t),
  //   s: Math.round(100 * h),
  //   l: Math.round(100 * c),
  // };

  return `hsl(${Math.round(360 * t)}, ${Math.round(100 * h)}%, ${Math.round(
    100 * c
  )}%)`;
}

function getStart() {
  let result = [];
  var arrayKey = require("./weather_drawing_info.json").uniqueValueInfos;
  for (let i = 0; i < arrayKey.length; i++) {
    const element = arrayKey[i];
    result.push({
      name: element.label,
      color: element.symbol.color,
    });
  }

  var writeToFile = fs.createWriteStream("style.json");

  writeToFile.write(JSON.stringify(result));

  writeToFile.close();

  // const test = esriResult.features.map(x => JSON.stringify(x)).join('\n');
  // // console.log(test);
  // watch.write(test);
}
// getStyle();
// updateSyle();
// createStyle();
// getStart()

async function downloadPerimeters() {
  let idQueryString = "";
  let feeds = await knex("feeds")
    .select("id", "IrwinID", "origin", "link")
    .where(
      knex.raw(
        "(origin = 'I' and IrwinID is not null and isActive = 1) or (origin = 'N' and isActive = 1)"
      )
    )
    .orderBy("id", "desc");

  for (let index = 0; index < feeds.length; index++) {
    const element = feeds[index];
    if (element.origin == "N") {
      let correspondingI = await knex("N2Icrosswalk as N")
        .select(
          "feeds.id as id",
          "feeds.origin as origin",
          "feeds.IrwinId as IrwinID"
        )
        .leftJoin("feeds", "N.IrwinId", "=", "feeds.IrwinId")
        .where({ linkURI: element.link })
        .first();
      if (!correspondingI || correspondingI.IrwinID) continue;
      idQueryString += `'{${correspondingI.IrwinID}}',`;
    } else {
      idQueryString += `'{${element.IrwinID}}',`;
    }
  }
  idQueryString = idQueryString.slice(0, -1);

  idQueryString = `irwin_IrwiniD in (${idQueryString})`;

  const filePath = `fire_perimeters_${Date.now()}.json`;
  var watch = fs.createWriteStream(filePath);
  let esriResult;
  try {
    esriResult = await esri.queryFeatures({
      url: "https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/Fire_History_Perimeters_Public/FeatureServer/0",
      f: "geojson",
      where: idQueryString,
      httpMethod: "POST",
      outFields: "irwin_IncidentName",
    });
  } catch (error) {
    esriResult = {};
    console.log(error);
  }

  watch.write(JSON.stringify(esriResult));

  watch.on("close", () => {
    console.log("downlaod finished, trigger upload to mapbox");
    // createUpload(filePath)
  });

  watch.on("error", () => {
    console.log("Could not create file");
  });

  watch.close();

  let test = "";
}

downloadPerimeters();
