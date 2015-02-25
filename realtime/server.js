var http = require('http');
var Static = require('node-static');
//var app = http.createServer(handler);
var port = 8000;

var files = new Static.Server('./public');
var cons = require('consolidate')
var geoip = require('geoip-lite');

var uuid = require('node-uuid');
var Room = require('./room.js')
var url = require('url');
var metaData = require('./metaData.js')
var usStates = require('./us-states.js')
var geometryStateListData = {};
var compaignAllImpressionBooked = {};
var compaignAllAsPerState_CompBooked = {};
var _ = require('underscore')._;
var express = require('express');
var app = express();

//socket.set("log level", 1);
var people = {};
var rooms = {};
var clients = [];

var advertName = '';

function convertStateDataIntoMap() {
    //console.log("-----------")
    //console.log(usStates.statesData)
    usStates.statesData.features.forEach(function (obj, index) {
        geometryStateListData[obj.properties.name] = obj.geometry
    });
}
function convertMetaDataIntoCompaignTotalImpression() {
    metaData.metaData.forEach(function (obj, index) {
        var cmpName = obj.name;
        var impressionBooked = 0;
        //console.log("cmpName:::::"+cmpName)
        obj.states.forEach(function (state, index) {
            //console.log("state:::::"+state.impressionBooked)
            impressionBooked += parseInt(state.impressionBooked);
        });
        compaignAllImpressionBooked[cmpName] = impressionBooked
    });
}
function convertImpressionBookedIntoStateCmpNameObject() {
    metaData.metaData.forEach(function (obj, index) {
        var cmpName = obj.name;
        var impressionBooked = 0;
        //console.log("cmpName:::::"+cmpName)
        obj.states.forEach(function (state, index) {
            //console.log("state:::::"+state.impressionBooked)
            impressionBooked = parseInt(state.impressionBooked);
            var name = cmpName + "" + state.name
            compaignAllAsPerState_CompBooked[name] = impressionBooked
        });

    });
}
convertStateDataIntoMap();
convertImpressionBookedIntoStateCmpNameObject();
convertMetaDataIntoCompaignTotalImpression();

var currentSocketName = '';
var geoRegionData = new Array();
var geoLocationRegionArray = {
    "PA": "Pennsylvania",
    "FL": "Florida",
    "NC": "North Carolina",
    "TX": "Texas",
    "MO": "Missouri",
    "CA": "California",
    "OH": "Ohio",
    "TN": "Tennessee",
    "AL": "Alabama",
    "LA": "Louisiana",
    "GA": "Georgia",
    "SC": "South Carolina",
    "MS": "Mississippi",
    "KY": "Kentucky",
    "CT": "Connecticut",
    "MI": "Michigan",
    "WI": "Wisconsin",
    "IL": "Illinois",
    "OK": "Oklahoma",
    "NV": "Nevada",
    "KS": "Kansas",
    "IN": "Indiana",
    "NS": "",
    "NL": "",
    "CO": "Colorado",
    "VA": "Virginia",
    "MN": "Minnesota",
    "BC": "",
    "ON": "",
    "QC": "",
    "NB": "Nebraska",
    "AR": "Arkansas"
};


var server = http.createServer(app);
app.set('views', __dirname + '/public');
app.engine('html', cons.swig);
app.set('view engine', 'html');
var io = require('socket.io').listen(server);
app.use("/public", express.static(__dirname + '/public'));


app.get('/graph', function (req, res) {
    res.render('data.html');
});


function handler(request, response) {
    request.on('end', function () {
        files.serve(request, response);
    }).resume();
}


var headers = {
    'Content-Type': 'application/json'
};

var options = {
    host: '54.85.200.231',
    port: 8083,
    method: 'POST',
    path: '/druid/v2/?content-type=application/json',
    headers: headers
};


var people = {};
var rooms = {};
var sockets = [];
var currentSocketId = '';
var compaignString = '';

function createQueryForProcessRequest(socketName, locationURL) {
    var url_parts = url.parse(locationURL, true);
    var query = url_parts.query;
    advertName = query.advertName;
    compaignString = {
        "queryType": "groupBy",
        "dataSource": "adtracker",
        "granularity": "all",
        "dimensions": ["ip", "campaignName", "advertiser", "age", "segment", "gender"],

        "filter": { "type": "selector", "dimension": "advertiser", "value": advertName},
        "aggregations": [
            { "type": "count", "name": "rows" }

        ],
        "intervals": ["1990-10-01T00:00/2020-01-01T00"]
    };

    if (advertName == '' || advertName == null) {
        compaignString = {
            "queryType": "groupBy",
            "dataSource": "adtracker",
            "granularity": "all",
            "dimensions": ["ip", "campaignName", "advertiser", "age", "segment", "gender"],

            "aggregations": [
                { "type": "count", "name": "rows" }

            ],
            "intervals": ["1990-10-01T00:00/2020-01-01T00"]
        };
    }


    processRequestDataAndEmitEvent(compaignString, socketName);
    var intervalId = setInterval(function () {
        processRequestDataAndEmitEvent(compaignString, socketName)
    }, 10000);
    var o = _.findWhere(sockets, {'id': currentSocketId});
//    ////console.log(intervalId);
    o.interValId = intervalId;
    o.join(o.interValId);


}


var runInterval = false;

function ageGroupFetch(age) {
    var grpName = "";
    if (age >= 0 && age <= 30) {
        grpName = "grp_10_30"
    }
    if (age >= 31 && age <= 50) {
        grpName = "grp_31_50"
    }
    if (age >= 51) {
        grpName = "grp_51_above"
    }
    return grpName;
}

var stateListData = {};
var processedLocations = 0;
var compaginImpressionData = [];
var statesWithImpression = new Array();
var stateWithTotalImpressionServed = {}
var cityWithTotalImpressionServed = {}
var stateWithTotalImpressionBooked = {};
var stateWithCitiesImpression = {};


function convertMetaDataIntoStateImpressionBooked() {
    metaData.metaData.forEach(function (obj, index) {
        var cmpName = obj.name;
        var impressionBooked = 0;
        //console.log("cmpName:::::"+cmpName)
        obj.states.forEach(function (state, index) {
            //console.log("state:::::"+state.impressionBooked)
            if (stateWithTotalImpressionBooked[state.name] != undefined && stateWithTotalImpressionBooked[state.name] != '') {
                stateWithTotalImpressionBooked[state.name] = stateWithTotalImpressionBooked[state.name] + state.impressionBooked
            } else
                stateWithTotalImpressionBooked[state.name] = parseInt(state.impressionBooked)
        });
    });
}
convertMetaDataIntoStateImpressionBooked();


function targetedAreaNotHaveImpression() {
    var targetWithNoImpressionCount = [];
    Object.keys(stateWithTotalImpressionBooked).forEach(function (key, index) {
        if (statesWithImpression.indexOf(key) == -1) {
            targetWithNoImpressionCount.push({
                'name': key,
                'totalImpressionServed': 0,
                'totalImpressionBooked': stateWithTotalImpressionBooked[key]
            })
        }
    });
    return targetWithNoImpressionCount;
}

function sendBackResponse(stateListData, socketName) {
    currentSocketName = socketName;
    var targetWithNoImpressionCount = targetedAreaNotHaveImpression();
    var finalJSONData = [];
    var comapingTopLevelImpression = [];
    var totalImpressionServed = 0;
    var totalImpressionBooked = 0;
    Object.keys(compaginImpressionData).forEach(function (key, index) {
        totalImpressionServed += compaginImpressionData[key].impressionServe;
        totalImpressionBooked += compaginImpressionData[key].impressionBooked;
        comapingTopLevelImpression.push(compaginImpressionData[key])
    });
    Object.keys(stateListData).forEach(function (key, index) {

        if (geometryStateListData[key] != undefined && geometryStateListData[key] != null && geometryStateListData[key] != "") {
            var currentJSonObject = stateListData[key];
            var featureJsonObject = {
                "type": "Feature",
                "id": index,
                "properties": currentJSonObject,
                "totalImpressionServed": stateWithTotalImpressionServed[key] != undefined ? stateWithTotalImpressionServed[key] : 0,
                "totalImpressionBooked": stateWithTotalImpressionBooked[key] != undefined ? stateWithTotalImpressionBooked[key] : 0,
                "geometry": geometryStateListData[key]

            };
            finalJSONData.push(featureJsonObject);
        }
    });

    targetWithNoImpressionCount.forEach(function (key, index) {

        if (geometryStateListData[key.name] != undefined && geometryStateListData[key.name] != null && geometryStateListData[key.name] != "") {
            var featureJsonObject = {
                "type": "Feature",
                "id": index,
                "properties": key,
                "totalImpressionServed": stateWithTotalImpressionServed[key] != undefined ? stateWithTotalImpressionServed[key] : 0,
                "totalImpressionBooked": stateWithTotalImpressionBooked[key] != undefined ? stateWithTotalImpressionBooked[key] : 0,
                "geometry": geometryStateListData[key.name]

            };
            finalJSONData.push(featureJsonObject);
        }
    });


    var finalStateInformationAboutJson = {
        "type": "FeatureCollection",
        "features": finalJSONData,
        "compaignData": comapingTopLevelImpression,
        "totalImpressionServed": totalImpressionServed,
        "totalImpressionBooked": totalImpressionBooked
    };

    console.log("------------------------------------------------Response-------------")

    io.sockets.emit(socketName, finalStateInformationAboutJson);
}

function processQueryWithCompaignFilter(filterName, socketName) {
    if (filterName == "All") {
        compaignString = {
            "queryType": "groupBy",
            "dataSource": "adtracker",
            "granularity": "all",
            "dimensions": ["ip", "campaignName", "advertiser", "age", "segment", "gender"],

            "filter": { "type": "selector", "dimension": "advertiser", "value": advertName},
            "aggregations": [
                { "type": "count", "name": "rows" }

            ],
            "intervals": ["1990-10-01T00:00/2020-01-01T00"]
        };
    } else {
        compaignString = {
            "queryType": "groupBy",
            "dataSource": "adtracker",
            "granularity": "all",
            "dimensions": ["ip", "campaignName", "advertiser", "age", "segment", "gender"],
            "filter": {"type": "and", "fields": [
                { "type": "selector", "dimension": "advertiser", "value": advertName},
                { "type": "selector", "dimension": "campaignName", "value": filterName}
            ]},
            "aggregations": [
                { "type": "count", "name": "rows" }

            ],
            "intervals": ["1990-10-01T00:00/2020-01-01T00"]
        };
    }
    console.log(compaignString)
    processRequestDataAndEmitEvent(compaignString, socketName)
}

function processRequestDataAndEmitEvent(queryString1, socketName) {

    var queryString = JSON.stringify(queryString1);
    ////console.log("queryString:::::" + queryString);
//    io.sockets.emit(socketName, queryString);
//    var responseString = '[{"version":"v1","timestamp":"2000-10-01T00:00:00.000Z","event":{"campaignname":"Bye one get one free","segment":"News","age":"40","gender":"Female","advertiser":"Snapdeal","rows":1,"ip":"162.208.49.45"}},{"version":"v1","timestamp":"2000-10-01T00:00:00.000Z","event":{"campaignname":"Bye one get one free","segment":"Business","age":"60","gender":"Female","advertiser":"Snapdeal","rows":1,"ip":"162.208.49.45"}},{"version":"v1","timestamp":"2000-10-01T00:00:00.000Z","event":{"campaignname":"Dhamaka Sale","segment":"News","age":"30","gender":"Female","advertiser":"Snapdeal","rows":1,"ip":"162.208.49.45"}},{"version":"v1","timestamp":"2000-10-01T00:00:00.000Z","event":{"campaignname":"X-mas Bonanga","segment":"Business","age":"40","gender":"Male","advertiser":"Snapdeal","rows":1,"ip":"162.216.155.136"}},{"version":"v1","timestamp":"2000-10-01T00:00:00.000Z","event":{"campaignname":"Bye one get one free","segment":"News","age":"20","gender":"Female","advertiser":"Snapdeal","rows":1,"ip":"162.252.33.53"}},{"version":"v1","timestamp":"2000-10-01T00:00:00.000Z","event":{"campaignname":"Don\'t miss it","segment":"Business","age":"20","gender":"Male","advertiser":"Snapdeal","rows":1,"ip":"162.252.33.53"}},{"version":"v1","timestamp":"2000-10-01T00:00:00.000Z","event":{"campaignname":"X-mas Bonanga","segment":"News","age":"20","gender":"Male","advertiser":"Snapdeal","rows":1,"ip":"162.252.33.53"}},{"version":"v1","timestamp":"2000-10-01T00:00:00.000Z","event":{"campaignname":"Dhamaka Sale","segment":"News","age":"30","gender":"Male","advertiser":"Snapdeal","rows":1,"ip":"209.170.151.142"}},{"version":"v1","timestamp":"2000-10-01T00:00:00.000Z","event":{"campaignname":"Bye one get one free","segment":"News","age":"60","gender":"Female","advertiser":"Snapdeal","rows":1,"ip":"98.254.61.42"}},{"version":"v1","timestamp":"2000-10-01T00:00:00.000Z","event":{"campaignname":"X-mas Bonanga","segment":"Politics","age":"30","gender":"Male","advertiser":"Snapdeal","rows":1,"ip":"98.254.72.39"}},{"version":"v1","timestamp":"2000-10-01T00:00:00.000Z","event":{"campaignname":"Bye one get one free","segment":"Business","age":"60","gender":"Male","advertiser":"Snapdeal","rows":1,"ip":"98.255.181.238"}},{"version":"v1","timestamp":"2000-10-01T00:00:00.000Z","event":{"campaignname":"Dhamaka Sale","segment":"News","age":"50","gender":"Male","advertiser":"Snapdeal","rows":1,"ip":"98.255.181.238"}},{"version":"v1","timestamp":"2000-10-01T00:00:00.000Z","event":{"campaignname":"Bye one get one free","segment":"Business","age":"20","gender":"Female","advertiser":"Snapdeal","rows":1,"ip":"98.255.38.219"}},{"version":"v1","timestamp":"2000-10-01T00:00:00.000Z","event":{"campaignname":"Don\'t miss it","segment":"Politics","age":"60","gender":"Female","advertiser":"Snapdeal","rows":1,"ip":"98.255.38.219"}},{"version":"v1","timestamp":"2000-10-01T00:00:00.000Z","event":{"campaignname":"X-mas Bonanga","segment":"Politics","age":"50","gender":"Female","advertiser":"Snapdeal","rows":1,"ip":"98.255.38.219"}},{"version":"v1","timestamp":"2000-10-01T00:00:00.000Z","event":{"campaignname":"X-mas Bonanga","segment":"Business","age":"10","gender":"Female","advertiser":"Snapdeal","rows":1,"ip":"98.26.1.170"}},{"version":"v1","timestamp":"2000-10-01T00:00:00.000Z","event":{"campaignname":"Bye one get one free","segment":"Business","age":"50","gender":"Male","advertiser":"Snapdeal","rows":1,"ip":"98.26.118.184"}},{"version":"v1","timestamp":"2000-10-01T00:00:00.000Z","event":{"campaignname":"Fashion week","segment":"Politics","age":"60","gender":"Male","advertiser":"Snapdeal","rows":1,"ip":"98.26.118.184"}},{"version":"v1","timestamp":"2000-10-01T00:00:00.000Z","event":{"campaignname":"X-mas Bonanga","segment":"News","age":"40","gender":"Female","advertiser":"Snapdeal","rows":1,"ip":"98.26.118.184"}},{"version":"v1","timestamp":"2000-10-01T00:00:00.000Z","event":{"campaignname":"Bye one get one free","segment":"Politics","age":"20","gender":"Female","advertiser":"Snapdeal","rows":1,"ip":"98.26.130.122"}},{"version":"v1","timestamp":"2000-10-01T00:00:00.000Z","event":{"campaignname":"Dhamaka Sale","segment":"Politics","age":"40","gender":"Female","advertiser":"Snapdeal","rows":1,"ip":"98.26.130.122"}}]'
    var req1 = http.request(options, function (res) {
        var responseString = '';

        res.on('data', function (data) {
            responseString += data;
        });
//
        res.on('end', function () {

            var resultObject = JSON.parse(responseString);
            var jsonData = [];
            jsonData.push({"type": "FeatureCollection"});
            stateListData = {};
            processedLocations = 0;
            compaginImpressionData = {};
            statesWithImpression = new Array();
            stateWithTotalImpressionServed = {};
            stateWithCitiesImpression = {};
            resultObject.forEach(function (obj) {
                makeJsonData(obj)
            });

            sendBackResponse(stateListData, socketName)

        });
    });
    req1.on('error', function (e) {
        console.log(e)
    });

    req1.write(queryString);
    req1.end();

}


function createCompJson(obj, cmpImpressionData, geo1) {
    var impressionCountData = {};
    var gender = obj.event.gender;
    var age = obj.event.age;
    var segmentation = obj.event.segment;
    var cmpname = obj.event.campaignname;
    var count = obj.event.rows;
    var lat = geo1.ll[0];
    var lan = geo1.ll[1];
    count = parseInt(count) != 'NAN' ? parseInt(count) : 0;
    var ageGroup = ageGroupFetch(parseInt(age));
    if (gender == 'Male') {
        impressionCountData['Male'] = count;
    }
    if (gender == 'Female') {
        impressionCountData['Female'] = count;
    }
    if (ageGroup == 'grp_10_30') {
        impressionCountData['grp_10_30'] = count;
    }
    if (ageGroup == 'grp_31_50') {
        impressionCountData['grp_31_50'] = count;
    }
    if (ageGroup == 'grp_51_above') {
        impressionCountData['grp_51_above'] = count;
    }

    if (segmentation == 'Business') {
        impressionCountData['Business'] = count;
    }
    if (segmentation == 'Politics') {
        impressionCountData['Politics'] = count;
    }
    if (segmentation == 'News') {
        impressionCountData['News'] = count;
    }

    if (cmpImpressionData[cmpname] != undefined && cmpImpressionData[cmpname] != '') {
        var cmpJSONObject = cmpImpressionData[cmpname];
        cmpJSONObject.impressionServe = parseInt(cmpJSONObject.impressionServe) + count;
        if (gender == 'Male') {
            var maleObject = cmpJSONObject.Gender[0].Male;
            cmpJSONObject.Gender[0].Male = {
                "impressionServe": parseInt(maleObject.impressionServe) + count
            };
        }
        if (gender == 'Female') {
            var femaleObject = cmpJSONObject.Gender[0].Female;
            cmpJSONObject.Gender[0].Female = {
                "impressionServe": parseInt(femaleObject.impressionServe) + count
            };
        }
        if (ageGroup == 'grp_10_30') {
            var grp_10_30Object = cmpJSONObject.Age[0].grp_10_30;
            cmpJSONObject.Age[0].grp_10_30 = {
                "impressionServe": parseInt(grp_10_30Object.impressionServe) + count
            };
        }
        if (ageGroup == 'grp_31_50') {
            var grp_10_50Object = cmpJSONObject.Age[0].grp_31_50;
            cmpJSONObject.Age[0].grp_31_50 = {
                "impressionServe": parseInt(grp_10_50Object.impressionServe) + count
            };
        }
        if (ageGroup == 'grp_51_above') {
            var grp_51_aboveObject = cmpJSONObject.Age[0].grp_51_above;
            cmpJSONObject.Age[0].grp_51_above = {
                "impressionServe": parseInt(grp_51_aboveObject.impressionServe) + count
            };
        }

        if (segmentation == 'Business') {
            var BusinessObject = cmpJSONObject.Segmentation[0].Business;
            cmpJSONObject.Segmentation[0].Business = {
                "impressionServe": parseInt(BusinessObject.impressionServe) + count
            };
        }
        if (segmentation == 'Politics') {
            var PoliticsObject = cmpJSONObject.Segmentation[0].Politics;
            cmpJSONObject.Segmentation[0].Politics = {
                "impressionServe": parseInt(PoliticsObject.impressionServe) + count
            };
        }
        if (segmentation == 'News') {
            var NewsObject = cmpJSONObject.Segmentation[0].News;
            cmpJSONObject.Segmentation[0].News = {
                "impressionServe": parseInt(NewsObject.impressionServe) + count
            };
        }
        cmpImpressionData[cmpname] = cmpJSONObject;
    } else {
        var compImpressionObject =
        {
            "name": cmpname,
            "lat": lat,
            "lon": lan,
            "impressionBooked": compaignAllImpressionBooked[cmpname] ? compaignAllImpressionBooked[cmpname] : 0,
            "Gender": [
                {
                    "Male": {
                        "impressionServe": impressionCountData['Male'] != undefined ? impressionCountData['News'] : 0
                    },

                    "Female": {
                        "impressionServe": impressionCountData['Female'] != undefined ? impressionCountData['Female'] : 0
                    }
                }
            ],
            "Age": [
                {
                    "grp_10_30": {
                        "impressionServe": impressionCountData['grp_10_30'] != undefined ? impressionCountData['grp_10_30'] : 0
                    },

                    "grp_31_50": {
                        "impressionServe": impressionCountData['grp_31_50'] != undefined ? impressionCountData['grp_31_50'] : 0
                    },
                    "grp_51_above": {
                        "impressionServe": impressionCountData['grp_51_above'] != undefined ? impressionCountData['grp_51_above'] : 0
                    }
                }
            ],
            "Segmentation": [
                {
                    "Business": {
                        "impressionServe": impressionCountData['Business'] != undefined ? impressionCountData['Business'] : 0
                    },

                    "Politics": {
                        "impressionServe": impressionCountData['Politics'] != undefined ? impressionCountData['Politics'] : 0
                    },
                    "News": {
                        "impressionServe": impressionCountData['News'] != undefined ? impressionCountData['News'] : 0
                    }
                }
            ],
            "impressionServe": count
        };
        cmpImpressionData[cmpname] = compImpressionObject;

    }
    return cmpImpressionData;
}


function mergeComapiginImpressionData(gender, ageGroup, segmentation, cmpJSONObject, count) {
    if (gender == 'Male') {
        var maleObject = cmpJSONObject.Gender[0].Male;
        cmpJSONObject.Gender[0].Male = {
            "impressionServe": parseInt(maleObject.impressionServe) + count
        };
    }
    if (gender == 'Female') {
        var femaleObject = cmpJSONObject.Gender[0].Female;
        cmpJSONObject.Gender[0].Female = {
            "impressionServe": parseInt(femaleObject.impressionServe) + count
        };
    }
    if (ageGroup == 'grp_10_30') {
        var grp_10_30Object = cmpJSONObject.Age[0].grp_10_30;
        cmpJSONObject.Age[0].grp_10_30 = {
            "impressionServe": parseInt(grp_10_30Object.impressionServe) + count
        };
    }
    if (ageGroup == 'grp_31_50') {
        var grp_10_50Object = cmpJSONObject.Age[0].grp_31_50;
        cmpJSONObject.Age[0].grp_31_50 = {
            "impressionServe": parseInt(grp_10_50Object.impressionServe) + count
        };
    }
    if (ageGroup == 'grp_51_above') {
        var grp_51_aboveObject = cmpJSONObject.Age[0].grp_51_above;
        cmpJSONObject.Age[0].grp_51_above = {
            "impressionServe": parseInt(grp_51_aboveObject.impressionServe) + count
        };
    }

    if (segmentation == 'Business') {
        var BusinessObject = cmpJSONObject.Segmentation[0].Business;
        cmpJSONObject.Segmentation[0].Business = {
            "impressionServe": parseInt(BusinessObject.impressionServe) + count
        };
    }
    if (segmentation == 'Politics') {
        var PoliticsObject = cmpJSONObject.Segmentation[0].Politics;
        cmpJSONObject.Segmentation[0].Politics = {
            "impressionServe": parseInt(PoliticsObject.impressionServe) + count
        };
    }
    if (segmentation == 'News') {
        var NewsObject = cmpJSONObject.Segmentation[0].News;
        cmpJSONObject.Segmentation[0].News = {
            "impressionServe": parseInt(NewsObject.impressionServe) + count
        };
    }
    return cmpJSONObject;
}
function makeJsonData(obj) {

    var geo1 = geoip.lookup(obj.event.ip);
    if (geo1 != undefined) {
        var regionName = geo1.region;
        var cityValue = geo1.city;
        var gender = obj.event.gender;
        var segmentation = obj.event.segment;
        regionName = geoLocationRegionArray[regionName];
        var state = regionName;
        var cmpname = obj.event.campaignname;
        var cmp_state_name = cmpname + "" + state
        if (compaignAllAsPerState_CompBooked[cmp_state_name] != undefined && compaignAllAsPerState_CompBooked[cmp_state_name] > 0) {
            var age = obj.event.age;
            var lat = geo1.ll[0];
            var lan = geo1.ll[1];
            if (regionName != undefined && regionName != '' && lat != undefined && lat != '' && lat != null) {
                if (geoRegionData.indexOf(regionName) == -1)
                    geoRegionData.push(regionName);
                var count = obj.event.rows;
                count = parseInt(count) != 'NAN' ? parseInt(count) : 0;
                compaginImpressionData = createCompJson(obj, compaginImpressionData, geo1);

                if (stateListData[state] != undefined && stateListData[state] != '') {
                    var stateObject = stateListData[state];
                    var compJSONAray = stateListData[state].compaignData;
                    var citiesArray = stateListData[state].cities;
                    stateListData[state].cities = createCityWithStateMapObject(citiesArray, cityValue, obj, geo1, cmpname);
                    var stateImpMap = []
                    compJSONAray.forEach(function (cmpJsonObj, index) {
                        stateImpMap [cmpJsonObj.name] = cmpJsonObj;
                    });
                    if (statesWithImpression.indexOf(state) == -1)
                        statesWithImpression.push(state);

                    if (stateWithTotalImpressionServed[state] != undefined) {
                        stateWithTotalImpressionServed[state] = stateWithTotalImpressionServed[state] + count
                    } else
                        stateWithTotalImpressionServed[state] = count;


                    var stateCmpImpressionObject = createCompJson(obj, stateImpMap, geo1);
                    stateCmpImpressionObject = stateCmpImpressionObject[cmpname]
                    var densityCount = stateListData[state].density + count;
                    stateObject.density = densityCount;
                    var compaingObjectExist = false;
                    compJSONAray.forEach(function (compainObject, index) {
                        if (compainObject.name != undefined && compainObject.name == cmpname) {
                            compainObject.Gender = stateCmpImpressionObject.Gender;
                            compainObject.Segmentation = stateCmpImpressionObject.Segmentation;
                            compainObject.impressionServe = stateCmpImpressionObject.impressionServe;
                            compainObject.Age = stateCmpImpressionObject.Age;
                            compJSONAray.splice(index, 1);
                            compJSONAray.push(compainObject);
                            compaingObjectExist = true;
                        }
                    })
                    if (!compaingObjectExist) {
                        var cmp_state_name = cmpname + "" + state;
                        var compaiginData = {
                            "name": cmpname,
                            "lat": lat,
                            "lon": lan,
                            "Gender": stateCmpImpressionObject.Gender,
                            "Age": stateCmpImpressionObject.Age,
                            "impressionBooked": compaignAllAsPerState_CompBooked[cmp_state_name] != undefined ? compaignAllAsPerState_CompBooked[cmp_state_name] : 0,
                            "Segmentation": stateCmpImpressionObject.Segmentation,
                            "impressionServe": stateCmpImpressionObject.impressionServe
                        };
                        compJSONAray.push(compaiginData);
                    }
                    stateObject.compaignData = compJSONAray;

                    stateListData[state] = stateObject;
                } else {
                    var comapinImpressionObject = createCompJson(obj, [], geo1);
                    comapinImpressionObject = comapinImpressionObject[cmpname]
                    var stateJSONObject = {
                        "name": state,
                        "density": count,
                        "lat": lat,
                        "lon": lan,
                        "cities": [
                            {
                                "name": cityValue,
                                "lat": lat,
                                "lon": lan,
                                "compaignData": [
                                    {
                                        "name": cmpname,
                                        "lat": lat,
                                        "lon": lan,
                                        "Gender": comapinImpressionObject.Gender,
                                        "Age": comapinImpressionObject.Age,
                                        "Segmentation": comapinImpressionObject.Segmentation,
                                        "impressionServe": comapinImpressionObject.impressionServe
                                    }

                                ]
                            }
                        ],
                        "compaignData": [
                            {
                                "name": cmpname,
                                "lat": lat,
                                "lon": lan,
                                "Gender": comapinImpressionObject.Gender,
                                "Age": comapinImpressionObject.Age,
                                "Segmentation": comapinImpressionObject.Segmentation,
                                "impressionServe": comapinImpressionObject.impressionServe,
                                "impressionBooked": compaignAllAsPerState_CompBooked[cmp_state_name] != undefined ? compaignAllAsPerState_CompBooked[cmp_state_name] : 0

                            }

                        ]

                    };

                    stateListData[state] = stateJSONObject;
                }
            }
        }
    }
}


function createCityWithStateMapObject(citiesArray, cityName, obj, geo1, cmpname) {
    var lat = geo1.ll[0];
    var lan = geo1.ll[1];
    var checkCity = false;
    citiesArray.forEach(function (cityJsonObject, index1) {
        if (cityJsonObject.name == cityName) {
            var compJSONAray = cityJsonObject.compaignData;
            var stateImpMap = [];
            compJSONAray.forEach(function (cmpJsonObj, index) {
                stateImpMap [cmpJsonObj.name] = cmpJsonObj;
            });

            var stateCmpImpressionObject = createCompJson(obj, stateImpMap, geo1);
            stateCmpImpressionObject = stateCmpImpressionObject[cmpname]

            var compaingObjectExist = false;
            compJSONAray.forEach(function (compainObject, index) {
                if (compainObject.name != undefined && compainObject.name == cmpname) {
                    compainObject.Gender = stateCmpImpressionObject.Gender;
                    compainObject.Segmentation = stateCmpImpressionObject.Segmentation;
                    compainObject.impressionServe = stateCmpImpressionObject.impressionServe;
                    compainObject.Age = stateCmpImpressionObject.Age;
                    compJSONAray.splice(index, 1);
                    compJSONAray.push(compainObject);
                    compaingObjectExist = true;
                }
            })
            if (!compaingObjectExist) {
                var compaiginData = {
                    "name": cmpname,
                    "lat": lat,
                    "lon": lan,
                    "Gender": stateCmpImpressionObject.Gender,
                    "Age": stateCmpImpressionObject.Age,
                    "Segmentation": stateCmpImpressionObject.Segmentation,
                    "impressionServe": stateCmpImpressionObject.impressionServe
                };
                compJSONAray.push(compaiginData);
            }
            cityJsonObject.compaignData = compJSONAray;
            citiesArray.splice(index1, 1);
            citiesArray.push(cityJsonObject);
            checkCity = true;
        }

    });
    if (!checkCity) {
        var comapinImpressionObject = createCompJson(obj, [], geo1);
        comapinImpressionObject = comapinImpressionObject[cmpname]
        var stateJSONObject = {
            "name": cityName,
            "lat": lat,
            "lon": lan,
            "compaignData": [
                {
                    "name": cmpname,
                    "lat": lat,
                    "lon": lan,
                    "Gender": comapinImpressionObject.Gender,
                    "Age": comapinImpressionObject.Age,
                    "Segmentation": comapinImpressionObject.Segmentation,
                    "impressionServe": comapinImpressionObject.impressionServe
                }

            ]

        };

        citiesArray.push(stateJSONObject)
    }
    return citiesArray;
}

io.sockets.on("connection", function (socket) {
    ////console.log("Socket Id for join server:::" + socket.id);


    socket.on("joinserver", function (name, device) {
        var exists = false;
        var ownerRoomID = inRoomID = null;

        _.find(people, function (key, value) {
            if (key.name.toLowerCase() === name.toLowerCase())
                return exists = true;
        });
        people[socket.id] = {"name": name, "owns": ownerRoomID, "inroom": inRoomID, "device": device};
        socket.emit("update", "You have connected to the server.");
        ////console.log("After Update:::");
        io.sockets.emit("update", people[socket.id].name + " is online.")
        sockets.push(socket);
        ////console.log("sockets::::::" + sockets);

    });

    socket.on("disconnect", function () {
        ////console.log("disconnect::::::::::::::::::::::" + socket.id);
        var o = _.findWhere(sockets, {'id': socket.id});
        sockets = _.without(sockets, o);
        try {
            if (o.interValId != undefined)
                clearInterval(o.interValId)
        } catch (e) {

        }

    });


    //Room functions
    socket.on("createRoom", function (name, roomType, locationURL) {
        ////console.log("socket.id:::::::::" + socket.id);
        ////console.log("locationURL::" + locationURL);
        var id = uuid.v4();
        var room = new Room(name, id, socket.id, roomType);
        rooms[id] = room;
        //add room to socket, and auto join the creator of the room
        socket.room = name;
        socket.join(socket.room);
        people[socket.id].owns = id;
        people[socket.id].inroom = id;
        currentSocketId = socket.id;
        room.addPerson(socket.id);
        socket.emit("update", "Welcome to " + room.name + ".");
        socket.emit("processGraph", room.id);
        createQueryForProcessRequest(room.id, locationURL);

        socket.on(room.id + "_filter", function (filterType) {
            console.log("Change Filter Event" + filterType);
            processQueryWithCompaignFilter(filterType, currentSocketName);

        });

    });
    socket.on("fetchRoomId", function (name, roomType, fn) {
        var match = false;
        _.find(rooms, function (key, value) {
            ////console.log("kedy------------------" + key);
            ////console.log("key.roomType------" + key.roomType);
            if (key.name === name && key.roomType == roomType)
                return match = key.id;
        });
        fn({result: match});
    });

});


server.listen(port);
////console.log('Your server goes on localhost:' + port);

var geo1 = geoip.lookup('98.30.210.246');
////console.log(geo1)