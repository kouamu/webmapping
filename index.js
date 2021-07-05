const express = require('express')
const app = express()
const port = 3000
const path = require('path');

var distance = require('google-distance-matrix');
distance.key('API-KEY');

var timezone = require('node-google-timezone');
timezone.key('API-KEY')

var timestamp = 1402629305;

// Middleware
app.use(express.json())

app.post('/api/get_distance_and_time', function (req, res) {

	try{

	distance.units(req.body.units);

	var origins      = [];
	var destinations = [];

	var coor_ori = req.body.start.lat+","+req.body.start.lng;
	var coor_des = req.body.end.lat+","+req.body.end.lng;

    origins.push(coor_ori.toString());
    destinations.push(coor_des.toString());
    var travelMode = 'DRIVING';

    // Fonction asynchrone qui retourne la distance et le temps
    async function fetchDistance(origin, dest, mode) {

    var lat1 = origin[0].split(",")[0];
    var lng1 = origin[0].split(",")[1];
    var lat2 = dest[0].split(",")[0];
    var lng2 = dest[0].split(",")[1];

    // Promise qui retourne le GMT de l'origine
    let gmt1_promise = new Promise((resolv, reject) => {
        let resp1;
        timezone.data(lat1, lng1, timestamp, function (err, tz) {

        // Forme de la réponse
        tz = {dstOffset : 0, rawOffset : -28800, status : "OK", timeZoneId : "America/Los_Angeles", timeZoneName : "Pacific Standard Time"}
        	
        	if (err) {
                resp1 = reject(err);
            } else {
                resp1 = resolv(tz);
            }
 
        });
        return resp1;     
    });

    // Promise qui retourne le GMT de la destination
    let gmt2_promise = new Promise((resolve, reject) => {
        let resp2;
        timezone.data(lat2, lng2, timestamp, function (err, tz) {

        // Forme de la réponse
        tz = { dstOffset: 3600, rawOffset: -18000, status: 'OK', timeZoneId: 'America/New_York', timeZoneName: 'Eastern Daylight Time' };
        	
        	if (err) {
                resp2 = reject(err);
            } else {
                resp2 = resolve(tz);
            }
 
        });

        return resp2;     
    });

    // Promise qui retourne la distance et la durée
    let distime_promise = new Promise((resolve, reject) => {
        let resp3;
        distance.matrix(origin, dest, mode, function (err, res) {
           // Forme de la réponse
    	    var res = {
                "destination_addresses": [
                    "Westminster Abbey, Westminster, London SW1P 3PA, UK"
                ],
                "origin_addresses": [
                    "Chapel, Fulham, London SW6 1BA, UK"
                ],
                "rows": [
                    {
                        "elements": [
                            {
                                "distance": {
                                    "text":"4.7 miles",
                                    "value":7563.898
                                },
                                "duration":{
                                    "text":"1 heure 52 min",
                                    "value":1860.0
                                },
                                "duration_in_traffic": { 
                                    "text":"31 min",
                                    "value":1860.0
                                },
                                "status":"OK"
                            } 
                        ]
                    }
                ],
                "status":"OK",
            }

            if (err) {
                resp3 = reject(err);
            } else {
                resp3 = resolve(res);
            }

        })

        return resp3;     
    });

    let gmt1    = await gmt1_promise;
    let gmt2    = await gmt2_promise;
    let distime = await distime_promise;

    // Récupère la distance
    var dista = distime.rows[0].elements[0].distance.text.split(" ");

    // Récupère la durée
    var duree = distime.rows[0].elements[0].duration.value;

    // Récupère les pays
    var country_dest = distime.destination_addresses[0].split(" ").pop();
    var country_orig = distime.origin_addresses[0].split(" ").pop();

    // Réponse du service
    var rep = {
            start: {
                country: country_orig,
                timezone: "GMT"+gmt1.rawOffset/3600,
                location: { lat: origins[0], lng: origins[1] }
            },
            end: {
                country: country_dest,
                timezone: "GMT"+gmt2.rawOffset/3600,
                location: { lat: destinations[0], lng: destinations[1] }
            },
            distance: {
                value: dista[0],
                units: dista[1]
            },
            time_diff: {
                value: Math.round(parseInt(duree/60)),
                units: "min"
            }
        }
   
    res.send(JSON.stringify(rep));
   }

   fetchDistance(origins, destinations, travelMode)

    }  catch(error) { 
        console.error(error);  
    }

})

 
app.listen(port, () => console.log('KOUAMU webmapping App'))
