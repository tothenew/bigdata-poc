$(function () {
    // generate unique user id
    var userId = Math.random().toString(16).substring(2, 15);
    var socket = io.connect('/');
    var doc = $(document);
    var roomUniqueID = '';
    // custom marker's icon styles
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
    var addMarker = true;
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

     iconArray['New Year Dhamaka'] = blackIcon;
     iconArray['X-mas Bonanga'] = blueIcon;
     iconArray['Republic Day Sale'] = brownIcon;
     iconArray["Sabse sasta"] = burgandyIcon;
     iconArray['Dhamaka Sale'] = dark_redIcon;
     iconArray["Big Sale"] = greenIcon;
     iconArray["Digital Bonanga"] = yellow_brownIcon;
     iconArray['CWC 2015'] = light_blueIcon;
     iconArray['IPL 8'] = light_brownIcon;
     iconArray['Fashion week'] = light_greenIcon;
     iconArray["Home Appliance"] = orangeIcon;
     iconArray['Bye one get one free'] = pinkIcon;
     iconArray["Refer a FRIEND and EARN "] = redIcon;


    var selectedCompaiginFilter = '';
    var loadingFirstTime = false;
    var map1 = new L.Map('map', {center: new L.LatLng(30.774, -98.125), zoom: 13});
    var layer = new L.StamenTileLayer('watercolor');
    map1.addLayer(layer);


    var lightIcon = L.Icon.Default;
    var darkIcon = L.Icon.Default.extend({options: {iconUrl: L.Icon.Default.imagePath + '/marker-desat.png'}});

    var oms = new OverlappingMarkerSpiderfier(map1);
    window.oms = oms;
    window.map1 = map1;
    window.iconArray = iconArray;
    var markerList = '';
    var iconWithColor = function(color) {
        return 'http://chart.googleapis.com/chart?chst=d_map_xpin_letter&chld=pin|+|' +
            color + '|000000|ffff00';
    }
    oms = new OverlappingMarkerSpiderfier(map1);
    var compaignData = new Array();
    socket.on("processGraph", function (roomId) {
        roomUniqueID = roomId;
        socket.on(roomId, function (data) {
            oms.clearMarkers();
            var campaignCount = new Object(); // or var map = {};

            console.log("On Side Client");
            console.log(selectedCompaiginFilter);
            var bounds = new L.LatLngBounds();
            markerList = new Array();
            var currentMarkerList = new Array();

            if(addMarker){
                if (markerList != '') {
                    for (var i = 0; i < markerList.length; i++) {
                        map1.removeLayer(markerList[i]);
                    }
                }
            }
        var pinCount = new Object();
            data.forEach(function (datum,index) {
                var k = datum.campaignname;

                if (pinCount[k] != '' && pinCount[k] != undefined && pinCount[k] != 'NAN') {
                    var currentCount = pinCount[k];
                    var totalCount = 1 + currentCount;
                    pinCount[k] = totalCount;
                } else {
                    var totalCount = 1
                    pinCount[k] = totalCount;
                }

                if(pinCount[k] <=4) {
                    if (campaignCount[k] != '' && campaignCount[k] != undefined && campaignCount[k] != 'NAN') {
                        var currentCount = campaignCount[k];
                        var totalCount = parseInt(datum.count) + currentCount;
                        campaignCount[k] = totalCount;
                    } else {
                        var totalCount = parseInt(datum.count);
                        campaignCount[k] = totalCount;
                    }




                    if (addMarker) {
                        if (selectedCompaiginFilter == '' || selectedCompaiginFilter.indexOf(datum.campaignname) > -1) {
                            var loc = new L.LatLng(datum.lat, datum.lan);
                            bounds.extend(loc);
                            var iconValue = iconArray[datum.campaignname];
                            if (iconValue == undefined) {
                                iconValue = yellowIcon;
                            }
                            var userMarker = L.marker(loc, {
                                style: getStyle(datum.count),
                                icon: iconValue
                            });


                            if (!loadingFirstTime) {
                                if (compaignData.indexOf(datum.campaignname) == -1)
                                    compaignData.push(datum.campaignname);
                            }
                            userMarker.desc = '<p>Total Number of rows for campaignname:: ' + datum.campaignname + " " + datum.count + ' for ip ' + datum.ip + ' </p>';
                            map1.addLayer(userMarker);
                            oms.addMarker(userMarker);

                            markerList.push(userMarker)
                        }
                    }
                }
            });
            console.log("compaignData::::"+addMarker);
            console.log("addMarker::::"+addMarker);
            if(!loadingFirstTime)
                createFilter(compaignData,campaignCount);
            else{
                $(compaignData).each(function (objValue) {
                    var compaignValue = compaignData[objValue].toString();
                    var idOfCheckBox = compaignValue.replace(/\s+/g, '-').replace(/[^a-zA-Z-]/g, '').toLowerCase();
                    var count = 0;
                    if(campaignCount[compaignValue] !='' && campaignCount[compaignValue] !=undefined  && campaignCount[compaignValue] !='NAN' ){
                        count = campaignCount[compaignValue];
                    }
                    $("#"+idOfCheckBox).html(" ("+count+")");
                })
            }
            loadingFirstTime = true;
            if(addMarker) {
                map1.fitBounds(bounds);
                var popup = new L.Popup({closeButton: false, offset: new L.Point(0.5, -24)});
                oms.addListener('click', function (marker) {
                    popup.setContent(marker.desc);
                    popup.setLatLng(marker.getLatLng());
                    map1.openPopup(popup);
                });
            }
            addMarker = false;

        });

        oms.addListener('spiderfy', function(markers) {
            console.log("zoon out");
            map1.zoomOut()
        });
        oms.addListener('unspiderfy', function(markers) {
            console.log("zoon in");
            map1.zoomIn()
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

    function createFilter(arrayData,campaignCount) {
        var html = '<input type="checkbox" name="filterChange" class="target" value="All" id="selectall" checked>All<br/>';
        arrayData.forEach(function (obj) {
            var idOfCheckBox = obj.replace(/\s+/g, '-').replace(/[^a-zA-Z-]/g, '').toLowerCase();
            html = html + '<input type="checkbox" name="filterChange" class="case"  value="' + obj + '" checked>' + obj;
            html = html + "<span id='"+idOfCheckBox+"'>(";
            html =  html + campaignCount[obj];
            html = html+")</span> <br/>";

        });
        $("#filters").html(html);
        $("#selectall").click(function () {
            $('.case').attr('checked', this.checked);
            bindCheckedAction();
            addMarker = true;
        });

        $('.case').click(function () {
            addMarker = true;
            if($(".case").length==$(".case:checked").length){
                $("#selectall").attr("checked","checked");}
            else{
                $("#selectall").removeAttr("checked");
            }
            bindCheckedAction();
        });


    }

    function bindCheckedAction(){
        selectedCompaiginFilter = new Array();
        var filterSocketName = roomUniqueID + "_filter";
        socket.emit(filterSocketName, "Call Function");
        $('#filters :checkbox:checked').each(function () {
            console.log("Checked---" + $(this).val());
            if ($(this).val() == 'All') {
                $('#filters :checkbox').each(function () {
                    selectedCompaiginFilter.push($(this).val());
                });
            } else
                selectedCompaiginFilter.push($(this).val());
        });
    }


    /*
     // check whether browser supports geolocation api
     if (navigator.geolocation) {
     navigator.geolocation.getCurrentPosition(positionSuccess, positionError, { enableHighAccuracy: true });
     } else {
     $('.map').text('Your browser is out of fashion, there\'s no geolocation!');
     }

     function positionSuccess(position) {
     var lat = position.coords.latitude;
     var lng = position.coords.longitude;
     var acr = position.coords.accuracy;

     // mark user's position
     var userMarker = L.marker([lat, lng], {
     icon: redIcon
     });

     var userMarker1 = L.marker([39.77, -105.23], {
     icon: yellowIcon
     });
     // uncomment for static debug
     // userMarker = L.marker([51.45, 30.050], { icon: redIcon });

     // load leaflet map
     map = L.map('map');

     L.tileLayer('https://{s}.tiles.mapbox.com/v3/examples.map-i87786ca/{z}/{x}/{y}.png', { maxZoom: 18, detectRetina: true }).addTo(map);

     // set map bounds
     map.fitWorld();
     userMarker.addTo(map);
     userMarker1.addTo(map);
     userMarker.bindPopup('<p>You are there! Your ID is ' + userId + '</p>').openPopup();

     var emit = $.now();
     // send coords on when user is active
     doc.on('mousemove', function() {
     active = true;

     sentData = {
     id: userId,
     active: active,
     coords: [{
     lat: lat,
     lng: lng,
     acr: acr
     }]
     };

     if ($.now() - emit > 30) {
     socket.emit('send:coords', sentData);
     emit = $.now();
     }
     });
     }

     doc.bind('mouseup mouseleave', function() {
     active = false;
     });

     // showing markers for connections
     function setMarker(data) {
     for (var i = 0; i < data.coords.length; i++) {
     var marker = L.marker([data.coords[i].lat, data.coords[i].lng], { icon: yellowIcon }).addTo(map);
     marker.bindPopup('<p>One more external user is here!</p>');
     markers[data.id] = marker;
     }
     }

     // handle geolocation api errors
     function positionError(error) {
     var errors = {
     1: 'Authorization fails', // permission denied
     2: 'Can\'t detect your location', //position unavailable
     3: 'Connection timeout' // timeout
     };
     showError('Error:' + errors[error.code]);
     }

     function showError(msg) {
     info.addClass('error').text(msg);

     doc.click(function() {
     info.removeClass('error');
     });
     }*/

    /*// delete inactive users every 15 sec
     setInterval(function() {
     for (var ident in connects){
     if ($.now() - connects[ident].updated > 15000) {
     delete connects[ident];
     map.removeLayer(markers[ident]);
     }
     }
     }, 15000);*/
});
