$(function () {
    // generate unique user id
    var userId = Math.random().toString(16).substring(2, 15);
    var socket = io.connect('/');
    var doc = $(document);
    var roomUniqueID = '';
    // custom marker's icon styles
    var statesData = {};
    var tinyIcon = L.Icon.extend({
        options: {
            shadowUrl: '../public/assets/marker-shadow.png',
            iconSize: [25, 39],
            iconAnchor: [12, 36],
            shadowSize: [41, 41],
            shadowAnchor: [12, 38],
            popupAnchor: [0, -30]
        }
    });

    var filterMarkerLink = new Array();
    var filterGroup = {
        "Gender": ["Male", "Female"],
        "Age": ["grp_10_30", "grp_31_50", "grp_51_above"],
        "Segmentation": ["Business", "Politics", "News"]
    };


    var selectTargetFilter = "Geo";
    var loadFirstTime = false;
    var stateLevelPinSelected = true;
    var addMarker = true;
    var cityLevelData = '';
    var blackIcon = new tinyIcon({ iconUrl: '../public/assets/black.png' });
    var blueIcon = new tinyIcon({ iconUrl: '../public/assets/blue.png' });
    var brownIcon = new tinyIcon({ iconUrl: '../public/assets/brown.png' });
    var burgandyIcon = new tinyIcon({ iconUrl: '../public/assets/burgandy.png' });
    var dark_redIcon = new tinyIcon({ iconUrl: '../public/assets/dark-red.png' });
    var greenIcon = new tinyIcon({ iconUrl: '../public/assets/green.png' });
    var light_blueIcon = new tinyIcon({ iconUrl: '../public/assets/light-blue.png' });
    var light_brownIcon = new tinyIcon({ iconUrl: '../public/assets/light-brown.png' });
    var light_greenIcon = new tinyIcon({ iconUrl: '../public/assets/light-green.png' });
    var orangeIcon = new tinyIcon({ iconUrl: '../public/assets/orange.png' });
    var pinkIcon = new tinyIcon({ iconUrl: '../public/assets/pink.png' });
    var redIcon = new tinyIcon({ iconUrl: '../public/assets/red.png' });
    var yellowIcon = new tinyIcon({ iconUrl: '../public/assets/yellow.png' });
    var yellow_brownIcon = new tinyIcon({ iconUrl: '../public/assets/yellow-brown.png' });

    var iconArray = new Object();

    iconArray['Male'] = blackIcon;
    iconArray['Female'] = yellowIcon;
    iconArray['Age 10-30'] = brownIcon;
    iconArray["Age 31-50"] = burgandyIcon;
    iconArray['Age above 51'] = dark_redIcon;
    iconArray["Business"] = greenIcon;
    iconArray["Politics"] = orangeIcon;
    iconArray['News'] = pinkIcon;
    iconArray['Gender'] = redIcon;
    iconArray['Segmentation'] = yellow_brownIcon;
    iconArray['Age'] = light_greenIcon;
//    iconArray['IPL 8'] = light_brownIcon;
//    iconArray['Fashion week'] = light_greenIcon;
//    iconArray["Home Appliance"] = orangeIcon;
//    iconArray['Bye one get one free'] = pinkIcon;
//    iconArray["Refer a FRIEND and EARN "] = redIcon;


    var selectedCompaiginFilter = '';
    var loadingFirstTime = false;
    var map = L.map('map').setView([30.774, -98.125], 4);

    L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
            '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="http://mapbox.com">Mapbox</a>',
        id: 'examples.map-20v6611k'
    }).addTo(map);


    var info = L.control();

    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info');
        this.update();
        return this._div;
    };

    info.update = function (props) {
        this._div.innerHTML = '<h4>Impression Status</h4>' + (props ?
            '<b>' + props.name + '</b><br />' + props.density + ' people / mi<sup>2</sup>'
            : 'Hover over a pin');
    };

    info.addTo(map);
    window.map1 = map;
    window.iconArray = iconArray;

    function getColor(d) {
        return d >= 7000 ? '#800026' :
                d >= 5000 && d < 6000 ? '#BD0026' :
                d >= 4000 && d < 5000 ? '#E31A1C' :
                d >= 3000 && d < 4000 ? '#FC4E2A' :
                d >= 2000 && d < 3000 ? '#FD8D3C' :
                d >= 1000 && d < 2000 ? '#FEB24C' :
                d >= 0 && d < 1000 ? '#FED976' :
            '#FFEDA0';
    }

    function style(feature) {
//    //console.log(getColor(feature.properties.density))
        return {
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7,
            fillColor: getColor(feature.properties.density)
        };
    }

    function highlightFeature(e) {
        var layer = e.target;
        //console.log("Fetire")
        layer.setStyle({
            weight: 5,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
        });

        if (!L.Browser.ie && !L.Browser.opera) {
            layer.bringToFront();
        }
        var propery = {'name': layer.feature.properties.name}
        info.update(layer.feature.properties);

    }


    function calculateImpressionRatePerServed(imB, imS) {
        return (  $('#rate').val(((imB - priceOne) / priceOne * 100).toFixed(2))    )
    }

    var geojson;

    function resetHighlight(e) {
        geojson.resetStyle(e.target);
        info.update();
    }

    function zoomToFeature(e) {
        var feature = e.target;
        //console.log(feature);
        map.fitBounds(e.target.getBounds());
    }


    var globalMarkerArray = new Array();
    var mapBound = map.getBounds();

    function onEachFeature(feature, layer) {
        layer.on({
            click: highlightFeature,
            mouseout: resetHighlight/*,
             click: zoomToFeature*/
        });
    }

    var markerList = '';
    var iconWithColor = function (color) {
        return 'http://chart.googleapis.com/chart?chst=d_map_xpin_letter&chld=pin|+|' +
            color + '|000000|ffff00';
    }
    var compaignData = new Array();
    socket.on("processGraph", function (roomId) {
        roomUniqueID = roomId;
        //TODO Need to uncommented out
        socket.on(roomId, function (data) {
            statesData = data;
//        var data = JSON.parse(localStorage.getItem("mydata"))
//        statesData = JSON.parse(localStorage.getItem("mydata"))
        window.statesData = statesData;
        geojson = L.geoJson(data, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);
        showGeoLocationImpressionCountOnMap();
        showDefaultBarChartForAllStatesAsCompaignWise(statesData.compaignData, selectTargetFilter);

        if (!loadFirstTime)
            createCompaignSelectBox();
        changeValueForImpressionAndRevenue();
        loadFirstTime = true;

        map.attributionControl.addAttribution('Population data &copy; <a href="http://census.gov/">US Census Bureau</a>');

        });
    });


    $(document).ready(function () {
        var compaginId = getParameterByName("compaginId");
        var advertName = getParameterByName("advertName");
        socket.emit("joinserver", advertName, "mobile");
        var locationURL = window.location.href;
        var roomName = "Campaign";
        var roomType = "Campaign";
        socket.emit("createRoom", roomName, roomType, locationURL);

    });

    var compaignDataObject = new Array();

    function createCompaignSelectBox() {
        var html = '<li style="margin-left: 10px; font-size: 16px; float:right;">Select Campaign</li>';
        html = html + "<select id='changeCompaigin' style='width: 680px; margin: 10px;' name = 'changeCompaigin' ><option value='All'>All</option> "
        statesData.compaignData.forEach(function (datum, index) {
            compaignDataObject.push(datum.name)
            html = html + '<option value="' + datum.name + '">' + datum.name + '</option>'

        });
        html = html + '</select>'
        $("#addCompFilter").html(html);
        bindOnChangeEventForCompaigin()
    }


    function changeValueForImpressionAndRevenue() {
        $("#totalImpressionServed").html(statesData.totalImpressionServed + " Impression Served");
        $("#totalImpressionBooked").html(statesData.totalImpressionBooked + " Impression Booked");
        $("#totalRevenue").html(revenueCalculate(statesData.totalImpressionBooked, statesData.totalImpressionServed) + " Revenue")
    }

    function revenueCalculate(imBooked, imServed) {
        return (imBooked / imServed)
    }


    function getParameterByName(name) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\?&]" + name + "=([^&#]*)",
            regex = new RegExp(regexS),
            results = regex.exec(window.location.href);
        if (results == null) {
            return "";
        } else {
            return decodeURIComponent(results[1].replace(/\+/g, " "));
        }
    }


    function getColor(d) {
        return d > 1000 ? '#800026' :
                d > 500 ? '#BD0026' :
                d > 200 ? '#E31A1C' :
                d > 100 ? '#FC4E2A' :
                d > 50 ? '#FD8D3C' :
                d > 20 ? '#FEB24C' :
                d > 10 ? '#FED976' :
            '#FFEDA0';
    }

    function getStyle(row) {
        return {
            color: getColor(row),
            weight: 2,
            fillOpacity: 0.7
        };
    }


    function showGeoLocationImpressionCountOnMap() {

        $(statesData.features).each(function (obj) {
            //console.log(this)
            var property = this.properties
            if (property.lat != "" && property.lat != undefined) {
                var lat = property.lat
                var lon = property.lon
                var ibcount = 0;
                var iscount = 0;
                var isCountArray = new Array();
                $(property.compaignData).each(function (index, obj1) {
                    ibcount = parseInt(obj1.impressionBooked) + ibcount;
                    isCountArray.push(parseInt(obj1.impressionServe));
                })
                var circle = L.marker([lat, lon], 1000, {
                    color: 'red',
                    fillColor: '#f03',
                    fillOpacity: 0.5,
                    title: ibcount
                }).addTo(map);

                circle.on("click", function (e) {
                    var ciites = property.cities;
                    var barData = {'Geo': isCountArray};
                    cityLevelData = ciites;
                    stateLevelPinSelected = false;
                    clearMarkerPins();
                    addPinsAtCityLevel(e, ciites, 'Geo');
                    renderBarChartAsPerFilterBasis(barData, 'Geo', property.compaignData);
//                    showDefaultBarChartForAllStatesAsCompaignWise('Geo');
                });
            }
        });
    }

    function addPinsAtCityLevel(e, cities, filterType) {
        var icon = {};
        var latArray = new Array();
        var group = new L.featureGroup();
        cities.forEach(function (data1) {
            var ll = L.marker([data1.lat, data1.lon], icon).bindPopup(data1.name);
            ll.on("mouseover", function (e) {
                ll.openPopup()
            });
            ll.on("click", function (e) {
                showDefaultBarChartForAllStatesAsCompaignWise(data1.compaignData, filterType)
            });
            latArray.push([data1.lat, data1.lon]);
            group.addLayer(ll);

        });

        filterMarkerLink.push(group);
        map.addLayer(group);
        console.log("lat: " + latArray);
        map.fitBounds(group.getBounds().pad(0.8));
        map.locate({maxZoom: 20});
    }


    function showDefaultBarChartForAllStatesAsCompaignWise(compaignData, typeOfFilter) {
        var defaultCompaignMapArray = {};
        $(compaignData).each(function (index, obj1) {
            //console.log(obj1.impressionServe)
            if (defaultCompaignMapArray['Geo'] != undefined) {
                defaultCompaignMapArray['Geo'].push(obj1.impressionServe)
            } else {
                defaultCompaignMapArray['Geo'] = [obj1.impressionServe]
            }
            $(obj1.Gender).each(function (index, gender) {
                var maleCount = gender.Male.impressionServe;
                var femaleCount = gender.Female.impressionServe;
                if (defaultCompaignMapArray['Male'] != undefined) {
                    defaultCompaignMapArray['Male'].push(maleCount)
                } else {
                    defaultCompaignMapArray['Male'] = [maleCount]
                }
                if (defaultCompaignMapArray['Female'] != undefined) {
                    defaultCompaignMapArray['Female'].push(femaleCount)
                } else {
                    defaultCompaignMapArray['Female'] = [femaleCount]
                }
            });

            $(obj1.Age).each(function (index, age) {
                var grp_10_30 = age.grp_10_30.impressionServe;
                var grp_31_50 = age.grp_31_50.impressionServe;
                var grp_51_above = age.grp_51_above.impressionServe;
                if (defaultCompaignMapArray['grp_10_30'] != undefined) {
                    defaultCompaignMapArray['grp_10_30'].push(grp_10_30)
                } else {
                    defaultCompaignMapArray['grp_10_30'] = [grp_10_30]
                }
                if (defaultCompaignMapArray['grp_31_50'] != undefined) {
                    defaultCompaignMapArray['grp_31_50'].push(grp_31_50)
                } else {
                    defaultCompaignMapArray['grp_31_50'] = [grp_31_50]
                }

                if (defaultCompaignMapArray['grp_51_above'] != undefined) {
                    defaultCompaignMapArray['grp_51_above'].push(grp_51_above)
                } else {
                    defaultCompaignMapArray['grp_51_above'] = [grp_51_above]
                }

            });

            $(obj1.Segmentation).each(function (index, segmentation) {
                var Business = segmentation.Business.impressionServe;
                var Politics = segmentation.Politics.impressionServe;
                var News = segmentation.News.impressionServe;
                if (defaultCompaignMapArray['News'] != undefined) {
                    defaultCompaignMapArray['News'].push(News)
                } else {
                    defaultCompaignMapArray['News'] = [News]
                }
                if (defaultCompaignMapArray['Politics'] != undefined) {
                    defaultCompaignMapArray['Politics'].push(Politics)
                } else {
                    defaultCompaignMapArray['Politics'] = [Politics]
                }

                if (defaultCompaignMapArray['Business'] != undefined) {
                    defaultCompaignMapArray['Business'].push(Business)
                } else {
                    defaultCompaignMapArray['Business'] = [Business]
                }

            });
        });
        if (typeOfFilter == 'Gender') {
            var barData = {'Male': defaultCompaignMapArray['Male'], 'Female': defaultCompaignMapArray['Female']}
            renderBarChartAsPerFilterBasis(barData, typeOfFilter, compaignData);
        }
        if (typeOfFilter == 'Age') {
            var barData = {'10-30': defaultCompaignMapArray['grp_10_30'], '31-50': defaultCompaignMapArray['grp_31_50'], 'Above 51': defaultCompaignMapArray['grp_51_above']}
            renderBarChartAsPerFilterBasis(barData, typeOfFilter, compaignData);
        }
        if (typeOfFilter == 'Segmentation') {
            var barData = {'Business': defaultCompaignMapArray['Business'], 'Politics': defaultCompaignMapArray['Politics'], 'News': defaultCompaignMapArray['News']}
            renderBarChartAsPerFilterBasis(barData, typeOfFilter, compaignData);
        }
        if (typeOfFilter == 'Geo') {
            var barData = {'Geo': defaultCompaignMapArray['Geo']}
            renderBarChartAsPerFilterBasis(barData, typeOfFilter, compaignData);
        }
        window.defaultCompaignMapArray = defaultCompaignMapArray

    }

    function renderBarChartAsPerFilterBasis(barMapData, typeOfFilter, compaignData) {
        var impressionBookedCount = [];
        var compaignArray = [];
        $("#target").html("");
        $(compaignData).each(function (index, obj) {
            compaignArray.push(obj.name);
            var ibcount = obj.impressionBooked;
            if (ibcount != undefined)
                impressionBookedCount.push(ibcount)
        });
        var compaignDataRow = '<tr><th></th>'
        $(compaignArray).each(function (index, data) {
            compaignDataRow = compaignDataRow + '<th>' + data + '</th>';
        });
        compaignDataRow = compaignDataRow + '</tr>';
        var tableRowHtml = "";
        if (impressionBookedCount.length > 0) {
            var ibRow = '<tr><th>Impressions</th>'
            $(impressionBookedCount).each(function (index, data) {
                ibRow = ibRow + '<td>' + data + '</td>';
            });
            ibRow = ibRow + '</tr>';

            tableRowHtml = ibRow;
        }
        //console.log(barMapData)
        $.each(barMapData, function (key, value) {
            var isRow = '<tr><th>' + key + ' Impression Served</th>'
            $(value).each(function (index, data) {
                isRow = isRow + '<td>' + data + '</td>';
            });
            isRow = isRow + '</tr>';
            tableRowHtml = tableRowHtml + isRow;
        });

        $("#tableHead").html(compaignDataRow);
        $("#tableBody").html(tableRowHtml);
        $('#source').tableBarChart('#target', '', false);

    }


    function addMarkerAndBindClick(markerMap, barData, barTitle, compaignData) {
        var markerLink = L.marker([markerMap['lat'], markerMap['lan']], {
                color: markerMap['color'],
                fillColor: markerMap['fillColor'],
                fillOpacity: 0.5,
                title: markerMap['titleCount'],
                icon: iconArray[markerMap['selectType']]}
        );
        map.addLayer(markerLink);
        filterMarkerLink.push(markerLink);
        markerLink.on("click", function (e) {
            if (markerMap['selectPinType'] == 'City') {
                stateLevelPinSelected = false;
            } else {
                stateLevelPinSelected = true;
            }

            renderBarChartAsPerFilterBasis(barData, markerMap['Filter'], compaignData);
        });

        var density = markerMap['titleCount'] / markerMap['impressionBooked'];
        if (markerMap['selectPinType'] == 'City') {
            console.log(markerMap['titleCount']);
            density = markerMap['titleCount'];
        }
        markerLink.on('mouseover', function (e) {
            var prop = {'name': markerMap['selectType'], density: density};
            info.update(prop)
        });
    }


    function showFilterClickOnFilter(filterType) {
        clearMarkerPins()
        $(statesData.features).each(function (obj) {
            var genderLinks = new Object();
            var ageLinks = new Object();
            var segmentationLinks = new Object();
            var compaignMapArray = new Object();
            var property = this.properties;
            var lat = property.lat;
            var lon = property.lon;
            var impressionBooked = 0;
            var compaignData = property.compaignData;
            createAggregatedImpressionServeCount(compaignData, genderLinks, ageLinks, segmentationLinks, compaignMapArray, impressionBooked)
            window.coordinates = this.geometry.coordinates;
            var coordinates = this.geometry.coordinates;
            if (coordinates != undefined && coordinates[0] != undefined && coordinates[0][1] != undefined) {
                if (filterType == 'Gender') {
                    addMarkerAndBindClick({lat: coordinates[0][1][1], lan: coordinates[0][1][0], color: "red", fillColor: "#0056", titleCount: genderLinks['Male'], Filter: "Gender", selectType: 'Male', impressionBooked: impressionBooked, selectPinType: 'state'}, {'Male': compaignMapArray['Male']}, "Bar Chart of Impression As Compagin wise for Male", compaignData)
                    addMarkerAndBindClick({lat: coordinates[0][2][1], lan: coordinates[0][2][0], color: "green", fillColor: "#0056", titleCount: genderLinks['Female'], Filter: "Gender", selectType: 'Female', impressionBooked: impressionBooked, selectPinType: 'state'}, {'Female': compaignMapArray['Female']}, "Bar Chart of Impression As Compagin wise for Female", compaignData)
                }
                if (filterType == 'Age') {

                    addMarkerAndBindClick({lat: coordinates[0][1][1], lan: coordinates[0][1][0], color: "blue", fillColor: "#0056", titleCount: ageLinks['grp_10_30'], Filter: "Age", selectType: 'Age 10-30', impressionBooked: impressionBooked, selectPinType: 'state'}, {'10-30': compaignMapArray['grp_10_30']}, "Bar Chart of Impression As Compagin wise for Age 10-30", compaignData)
                    addMarkerAndBindClick({lat: coordinates[0][2][1], lan: coordinates[0][2][0], color: "orange", fillColor: "#0056", titleCount: ageLinks['grp_31_50'], Filter: "Age", selectType: 'Age 31-50', impressionBooked: impressionBooked, selectPinType: 'state'}, {'31-50': compaignMapArray['grp_31_50']}, "Bar Chart of Impression As Compagin wise for Age 31-50", compaignData)
                    addMarkerAndBindClick({lat: coordinates[0][3][1], lan: coordinates[0][3][0], color: "yellow", fillColor: "#0056", titleCount: ageLinks['grp_51_above'], Filter: "Age", selectType: 'Age above 51', impressionBooked: impressionBooked, selectPinType: 'state'}, {'Above 51': compaignMapArray['grp_51_above']}, "Bar Chart of Impression As Compagin wise for Age Above 51", compaignData)
                }
                if (filterType == 'Segmentation') {

                    addMarkerAndBindClick({lat: coordinates[0][1][1], lan: coordinates[0][1][0], color: "grey", fillColor: "#0056", titleCount: segmentationLinks['Business'], Filter: "Segmentation", selectType: 'Business', impressionBooked: impressionBooked, selectPinType: 'state'}, {'Business': compaignMapArray['Business']}, "Bar Chart of Impression As Compagin wise for Segmentation Business", compaignData)
                    addMarkerAndBindClick({lat: coordinates[0][2][1], lan: coordinates[0][2][0], color: "pink", fillColor: "#0056", titleCount: segmentationLinks['Politics'], Filter: "Segmentation", selectType: 'Politics', impressionBooked: impressionBooked, selectPinType: 'state'}, {'Politics': compaignMapArray['Politics']}, "Bar Chart of Impression As Compagin wise for Segmentation Politics", compaignData)
                    addMarkerAndBindClick({lat: coordinates[0][3][1], lan: coordinates[0][3][0], color: "brown", fillColor: "#0056", titleCount: segmentationLinks['News'], Filter: "Segmentation", selectType: 'Politics', impressionBooked: impressionBooked, selectPinType: 'state'}, {'News': compaignMapArray['News']}, "Bar Chart of Impression As Compagin wise for Segmentation News", compaignData)
                }
            }
        })

    }


    function clearMarkerPins() {
        if (filterMarkerLink != '') {
            for (var i = 0; i < filterMarkerLink.length; i++) {
                map.removeLayer(filterMarkerLink[i]);
            }
        }
    }

    function showFilterClickOnFilterForCity(filterType, cities) {
        if (filterMarkerLink != '') {
            for (var i = 0; i < filterMarkerLink.length; i++) {
                map.removeLayer(filterMarkerLink[i]);
            }
        }
        $(cities).each(function (obj) {
            var genderLinks = new Object();
            var ageLinks = new Object();
            var segmentationLinks = new Object();
            var compaignMapArray = new Object()
            var impressionBooked = 0;
            var compaignData = this.compaignData;
            var lat = this.lat;
            var lon = this.lon;
            createAggregatedImpressionServeCount(compaignData, genderLinks, ageLinks, segmentationLinks, compaignMapArray, impressionBooked);
            if (filterType == 'Gender') {
                var count = genderLinks['Male'] + genderLinks['Female']
                addMarkerAndBindClick({lat: lat, lan: lon, color: "red", fillColor: "#0056", titleCount: count, Filter: "Gender", selectType: 'Gender', impressionBooked: impressionBooked, selectPinType: 'City'}, {'Male': compaignMapArray['Male'], 'Female': compaignMapArray['Female']}, "Bar Chart of Impression As Compagin wise for Gender", compaignData)
            }
            if (filterType == 'Age') {
                var count = compaignMapArray['grp_51_above'] + compaignMapArray['grp_10_30'] + compaignMapArray['grp_31_50'];
                addMarkerAndBindClick({lat: lat, lan: lon, color: "red", fillColor: "#0056", titleCount: count, Filter: "Age", selectType: 'Age', impressionBooked: impressionBooked, selectPinType: 'City'}, {'10-30': compaignMapArray['grp_10_30'], '31-50': compaignMapArray['grp_31_50'], 'Above 51': compaignMapArray['grp_51_above']}, "Bar Chart of Impression As Compagin wise for Age", compaignData)
            }
            if (filterType == 'Segmentation') {
                var count = compaignMapArray['grp_51_above'] + compaignMapArray['grp_10_30'] + compaignMapArray['grp_31_50'];
                addMarkerAndBindClick({lat: lat, lan: lon, color: "red", fillColor: "#0056", titleCount: count, Filter: "Segmentation", selectType: 'Segmentation', impressionBooked: impressionBooked, selectPinType: 'City'}, {'Business': compaignMapArray['Business'], 'Politics': compaignMapArray['Politics'], 'News': compaignMapArray['News']}, "Bar Chart of Impression As Compagin wise for Segmentation", compaignData)
            }
        });
    }


    function createAggregatedImpressionServeCount(compaignData, genderLinks, ageLinks, segmentationLinks, compaignMapArray, impressionBooked) {
        $(compaignData).each(function (index, obj1) {
            impressionBooked = impressionBooked + parseInt(obj1.impressionBooked);
            $(obj1.Gender).each(function (index, gender) {
                var maleCount = gender.Male.impressionServe;
                var femaleCount = gender.Female.impressionServe;
                if (genderLinks['Male'] != undefined) {
                    genderLinks['Male'] = parseInt(genderLinks['Male']) + maleCount
                } else {
                    genderLinks['Male'] = parseInt(maleCount)
                }
                if (genderLinks['Female'] != undefined) {
                    genderLinks['Female'] = parseInt(genderLinks['Female']) + femaleCount
                } else {
                    genderLinks['Female'] = parseInt(femaleCount)
                }
                if (compaignMapArray['Male'] != undefined) {
                    compaignMapArray['Male'].push(maleCount)
                } else {
                    compaignMapArray['Male'] = [maleCount]
                }
                if (compaignMapArray['Female'] != undefined) {
                    compaignMapArray['Female'].push(femaleCount)
                } else {
                    compaignMapArray['Female'] = [femaleCount]
                }
            });

            $(obj1.Age).each(function (index, age) {
                var grp_10_30 = age.grp_10_30.impressionServe;
                var grp_31_50 = age.grp_31_50.impressionServe;
                var grp_51_above = age.grp_51_above.impressionServe;
                if (ageLinks['grp_10_30'] != undefined) {
                    ageLinks['grp_10_30'] = parseInt(ageLinks['grp_10_30']) + grp_10_30
                } else {
                    ageLinks['grp_10_30'] = parseInt(grp_10_30)
                }
                if (ageLinks['grp_31_50'] != undefined) {
                    ageLinks['grp_31_50'] = parseInt(ageLinks['grp_31_50']) + grp_31_50
                } else {
                    ageLinks['grp_31_50'] = parseInt(grp_31_50)
                }
                if (ageLinks['grp_51_above'] != undefined) {
                    ageLinks['grp_51_above'] = parseInt(ageLinks['grp_51_above']) + grp_51_above
                } else {
                    ageLinks['grp_51_above'] = parseInt(grp_51_above)
                }

                if (compaignMapArray['grp_10_30'] != undefined) {
                    compaignMapArray['grp_10_30'].push(grp_10_30)
                } else {
                    compaignMapArray['grp_10_30'] = [grp_10_30]
                }
                if (compaignMapArray['grp_31_50'] != undefined) {
                    compaignMapArray['grp_31_50'].push(grp_31_50)
                } else {
                    compaignMapArray['grp_31_50'] = [grp_31_50]
                }

                if (compaignMapArray['grp_51_above'] != undefined) {
                    compaignMapArray['grp_51_above'].push(grp_51_above)
                } else {
                    compaignMapArray['grp_51_above'] = [grp_51_above]
                }

            });

            $(obj1.Segmentation).each(function (index, segmentation) {
                var Business = segmentation.Business.impressionServe;
                var Politics = segmentation.Politics.impressionServe;
                var News = segmentation.News.impressionServe;
                if (segmentationLinks['Business'] != undefined) {
                    segmentationLinks['Business'] = parseInt(segmentationLinks['Business']) + Business
                } else {
                    segmentationLinks['Business'] = parseInt(Business)
                }
                if (segmentationLinks['Politics'] != undefined) {
                    segmentationLinks['Politics'] = parseInt(segmentationLinks['Politics']) + Politics
                } else {
                    segmentationLinks['Politics'] = parseInt(Politics)
                }
                if (segmentationLinks['News'] != undefined) {
                    segmentationLinks['News'] = parseInt(segmentationLinks['News']) + News
                } else {
                    segmentationLinks['News'] = parseInt(News)
                }

                if (compaignMapArray['News'] != undefined) {
                    compaignMapArray['News'].push(News)
                } else {
                    compaignMapArray['News'] = [News]
                }
                if (compaignMapArray['Politics'] != undefined) {
                    compaignMapArray['Politics'].push(Politics)
                } else {
                    compaignMapArray['Politics'] = [Politics]
                }

                if (compaignMapArray['Business'] != undefined) {
                    compaignMapArray['Business'].push(Business)
                } else {
                    compaignMapArray['Business'] = [Business]
                }

            });

        });
    }

    function renderBarChart(compaignData, typeOfFilter) {
        console.log("compaignData::::" + compaignData)
        var tableData = '<tr>'
        if (typeOfFilter == 'GEO') {
            var compaignArray = new Array();
            var title = "Bar Chart of Impression As Compagin wise";
            var impressionBookedCount = [];
            var impressionServedCount = [];
            $(compaignData).each(function (index, obj) {
                compaignArray.push(obj.name);
                var ibcount = obj.impressionBooked;
                var iscount = obj.impressionServed;
                impressionBookedCount.push(ibcount)
                impressionServedCount.push(iscount)

            });
            var compaignDataRow = '<tr><th></th>'
            $(compaignArray).each(function (index, data) {
                compaignDataRow = compaignDataRow + '<th>' + data + '</th>';
            });
            compaignDataRow = compaignDataRow + '</tr>';

            var isRow = '<tr><th>Impression Served</th>'
            $(impressionServedCount).each(function (index, data) {
                isRow = isRow + '<td>' + data + '</td>';
            });
            isRow = isRow + '</tr>';

            var ibRow = '<tr><th>Impression Bound</th>'
            $(impressionBookedCount).each(function (index, data) {
                ibRow = ibRow + '<td>' + data + '</td>';
            });
            ibRow = ibRow + '</tr>';
            $("#tableHead").html(compaignDataRow)
            $("#tableBody").html(isRow + ibRow)
            $('#source').tableBarChart('#target', '', false);
        }
    }

    function fireEventOnClickOfFilter(obj) {
        var filterType = $(obj).val();
        showFilterClickOnFilter(filterType)
        showDefaultBarChartForAllStatesAsCompaignWise(statesData.compaignData, filterType)
        selectTargetFilter = filterType;

    }

    $("#selectFilter").on("change", function (e) {
        var filterType = $(this).val();
        if (stateLevelPinSelected)
            showFilterClickOnFilter(filterType);
        else
            showFilterClickOnFilterForCity(filterType, cityLevelData);
        showDefaultBarChartForAllStatesAsCompaignWise(statesData.compaignData, filterType);
        selectTargetFilter = filterType;
        createDifferentIconAsPerTargetType(filterType)
    });

    function createDifferentIconAsPerTargetType(filterType) {
        var html = ' <li>            <span class="blue"></span>Geo        </li>';
        if (stateLevelPinSelected) {
            if (filterType == 'Gender') {
                html = html + '<li>                <span class="black"></span>Male            </li>'
                html = html + '<li>                <span class="yellow"></span>Female            </li>'
            }
            if (filterType == 'Age') {
                html = html + '<li>                <span class="brown"></span>Age 10-30            </li>'
                html = html + '<li>                <span class="burgandy"></span>Age 31-50            </li>'
                html = html + '<li>                <span class="red"></span>Age above 51           </li>'
            }
            if (filterType == 'Segmentation') {
                html = html + '<li>                <span class="green"></span>Business            </li>'
                html = html + '<li>                <span class="orange"></span>Politics            </li>'
                html = html + '<li>                <span class="pink"></span>News       </li>'
            }
        } else {
            if (filterType == 'Gender') {
                html = html + '<li>                <span class="red"></span>Gender            </li>'
            }
            if (filterType == 'Age') {
                html = html + '<li>                <span class="light_green"></span>Age        </li>'
            }
            if (filterType == 'Segmentation') {
                html = html + '<li>                <span class="yellow_brown"></span>Segmentation            </li>'
            }
        }
        $("#targetTypeIcon").html(html)
    }

    function bindOnChangeEventForCompaigin() {
        $("#changeCompaigin").on("change", function (e) {
            var value = $(this).val();
            var filterSocketName = roomUniqueID + "_filter";
            console.log("filterSocketName::::" + filterSocketName)
            console.log("value::::" + value)
            socket.emit(filterSocketName, value);
        });
    }

});
