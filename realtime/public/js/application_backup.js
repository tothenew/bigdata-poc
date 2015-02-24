$(function() {
	// generate unique user id
	var userId = Math.random().toString(16).substring(2,15);
	var socket = io.connect('/');
	var map;

	var info = $('#infobox');
	var doc = $(document);

	// custom marker's icon styles
	var tinyIcon = L.Icon.extend({
		options: {
			shadowUrl: '../public/assets/marker-shadow.png',
			iconSize: [25, 39],
			iconAnchor:   [12, 36],
			shadowSize: [41, 41],
			shadowAnchor: [12, 38],
			popupAnchor: [0, -30]
		}
	});
	var redIcon = new tinyIcon({ iconUrl: '../public/assets/marker-red.png' });
	var yellowIcon = new tinyIcon({ iconUrl: '../public/assets/marker-yellow.png' });


    console.log(">>>");
    map = L.map('map');
    L.tileLayer('https://{s}.tiles.mapbox.com/v3/examples.map-i87786ca/{z}/{x}/{y}.png', { maxZoom: 18, detectRetina: true }).addTo(map);
    // set map bounds

    var southWest = L.latLng(40.712, -74.227),
        northEast = L.latLng(30.774, -98.125);
    map.fitBounds([
        southWest,
        northEast
    ]);


    socket.on("update", function(msg) {
       console.log("Message::::"+msg);
    });


    socket.on("exists", function(data) {
      console.log("Exists")
      console.log(data)
    });


    socket.on("processGraph", function(roomId) {
       console.log("processGraph---------------------------"+roomId);

        socket.on(roomId, function (data){
            console.log("On Client")
            console.log(data)
            data.forEach(function (newValue) {
                console.log(newValue)
                var userMarker = L.marker([newValue.lat, newValue.lan], {
                    style: getStyle(newValue.count),
                    icon: redIcon
                });

                if(newValue.campaignname == "X-mas Bonanga") {
                    userMarker = L.marker([newValue.lat, newValue.lan], {
                        style: getStyle(newValue.count),
                        icon: yellowIcon
                    });
                }
                console.log("map:::::"+map);
                // load leaflet map
                userMarker.addTo(map);
                userMarker.bindPopup('<p>Total Number of rows for campaignname:: '+newValue.campaignname+ " "+ newValue.count + ' for ip '+ newValue.ip+' </p>').openPopup();

            })
        });
    });

    $(document).ready(function(){
        var compaginId = getParameterByName("compaginId");
        var advertName = getParameterByName("advertName");
        socket.emit("joinserver", advertName, "mobile");
        var locationURL = window.location.href;
        var roomName = "Campaign";
        var roomType = "Campaign";
        socket.emit("createRoom",roomName,roomType,locationURL);

    });


    function getParameterByName( name ){
        name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
        var regexS = "[\\?&]"+name+"=([^&#]*)",
            regex = new RegExp( regexS ),
            results = regex.exec( window.location.href );
        if( results == null ){
            return "";
        } else{
            return decodeURIComponent(results[1].replace(/\+/g, " "));
        }
    }



    function getColor(d) {
        return d > 1000 ? '#800026' :
                d > 500  ? '#BD0026' :
                d > 200  ? '#E31A1C' :
                d > 100  ? '#FC4E2A' :
                d > 50   ? '#FD8D3C' :
                d > 20   ? '#FEB24C' :
                d > 10   ? '#FED976' :
            '#FFEDA0';
    }

    function getStyle(row) {
        return {
            color: getColor(row),
            weight: 2,
            fillOpacity: 0.7
        };
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
