let myMapView, streetsMap, satelliteMap, topoMap, landslidesJSON, mylayer, r, Request, selectedService, BaseMapsSet, Graphic, inputID = document.getElementById("txtArcGISServerUrl")
const DEFAULT_PAGE_SIZE = 10

require([
        //Require API parameters    
        "esri/Map",
        "esri/views/MapView",
        "esri/views/SceneView",
        "esri/core/watchUtils",
        "esri/request",
        "esri/layers/MapImageLayer",
        "esri/layers/FeatureLayer",
        "esri/widgets/Legend",
        "esri/geometry/Extent",
        "esri/widgets/Search",
        "esri/Graphic",
    ],

    //Require Method 
    function(Map,
        MapView,
        SceneView,
        watchUtils,
        esriRequest,
        MapLayer,
        FeatureLayer,
        Legend,
        Extent,
        Search,
        GraphicClass)

    //Map, Viewport Declarations 
    {
        Graphic = GraphicClass;
        Request = esriRequest;
        map = new Map({
            basemap: 'topo'
        });
        myMapView = new MapView({
            id: 'mapView',
            container: 'mapViewDiv',
            zoom: 11,
            center: [-122.88989, 47.02454],
            map: map,
        });

        let legend = new Legend({
            view: myMapView
        });
        myMapView.ui.add(legend, "bottom-right");

        let search = new Search({
            view: myMapView
        });
        myMapView.ui.add(search, "bottom-left");

        //Move Extent Buttons
        var extbtn1 = document.getElementById("extbtn1");
        var extbtn2 = document.getElementById("extbtn2");
        var olyExtent = new Extent({
            xmax: -13664649.303552723,
            xmin: -13697670.099771874,
            ymax: 5950363.0927239945,
            ymin: 5940044.093905509,
            spatialReference: {
                wkid: 102100
            },
        });
        var seaExtent = new Extent({
            xmax: -13468309.415339744,
            xmin: -13732475.785093414,
            ymax: 6075891.466435814,
            ymin: 5993339.475887792,
            spatialReference: {
                wkid: 102100
            }
        });
        extbtn1.addEventListener("click", function() {
            myMapView.goTo(olyExtent)
        });
        extbtn2.addEventListener("click", function() {
            myMapView.goTo(seaExtent)
        });



        //populate the dropdown list of map services
        window.getRandomColor = function(element) {
                var letters = '0123456789ABCDEF';
                var color = '#';
                for (var i = 0; i < 6; i++) {
                    color += letters[Math.floor(Math.random() * 16)];
                }
                element.style.backgroundColor = color;
            }
            //query the sample server and list all map services in a dropdown


        populateMapServices(inputID.value)

        function populateMapServices(inputContent) {
            lstservices.innerHTML = ""
            let url = inputContent; //"https://sampleserver6.arcgisonline.com/arcgis/rest/services/?f=json";
            url = url + "/?f=json"
                //"https://hqolymgis29p.wsdot.loc:6443/arcgis/rest/services"
            let options = {
                responseType: "json"
            }
            Request(url, options).then(response => {
                let result = response.data;
                //Service list selector
                let lstservices = document.getElementById("lstservices");
                if (result.services.length > 0) {
                    for (let i = 0; i < result.services.length; i++) {
                        if (result.services[i].type == "MapServer") {
                            let option = document.createElement("option");
                            option.textContent = result.services[i].name;
                            getRandomColor(option);
                            lstservices.appendChild(option)
                        };
                    }
                } else {
                    checkFolders(url, inputContent, options)
                };
                //set event listener on change
                lstservices.addEventListener("change", onChangeServiceMap);
            })
        }

        function checkFolders(url, inputContent, options) {
            Request(url, options).then(response => {
                folders = response.data.folders
            })
            for (let i = 0; i < folders.length; i++) {
                svcURL = inputContent + "/" + folders[i] + "?f=json";
                Request(svcURL, options).then(response => {
                    let result = response.data;
                    for (let x = 0; x < response.data.services.length; x++) {
                        if (result.services[x].type == "MapServer") {
                            let option = document.createElement("option");
                            option.textContent = result.services[x].name;
                            getRandomColor(option);
                            lstservices.appendChild(option)
                        }
                    }
                })
            }
            lstservices.addEventListener("change", onChangeServiceMap)
        }
        function drawGeometry(geometry){
            let g;
            let s;
            //it is a line
            console.log(geometry)
            if (geometry.paths != undefined) {
                console.log("Line")
                g = {
                    type: "polyline",
                    paths: geometry.paths
                }
                s = {
                    type: "simple-line",
                    color: "red",
                    width: 4
                };
            }
            //it is a polygon
            
            else if (geometry.rings != undefined) {
                console.log("Polygon")
                g = {
                    type: "polygon",
                    rings: geometry.rings
                };
                s = {
                    type: "simple-fill",
                    style: "backward-diagonal",
                    color: "red",
                    width: 4
                }
            }
            // it is a point
            else {
                console.log("Point")
                g = {
                    type: "point",
                    longitude: geometry.x,
                    latitude: geometry.y
                };
                s = {
                    type: "simple-marker",
                    color: "blue"
                };
    
            }
            let graphic = new Graphic({
                geometry: g,
                symbol: s
            });
            myMapView.graphics.add(graphic);
        }
        function onChangeServiceMap() {
            let attributetable = document.getElementById("AttributeTable");
            let pagesDiv = document.getElementById("Pages");
            attributetable.innerHTML = " ";
            pagesDiv.innerHTML = " ";

            selectedService = lstservices.options[lstservices.selectedIndex].textContent;
            let mylayer = new MapLayer({
                url: document.getElementById("txtArcGISServerUrl").value + "/" + selectedService + "/MapServer"
            });
            map.removeAll();
            map.add(mylayer);
            mylayer.when(buildToc)
        }

        function projectandZoom(fullExtent) {
            if (fullExtent.spatialReference.wkid != 102100) {
            }
            let url = "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer/project";
            let options = {
                responseType: "json",
                query: {
                    f: "json",
                    inSR: JSON.stringify(fullExtent.spatialReference),
                    outSR: JSON.stringify(myMapView.extent.spatialReference),
                    geometries: JSON.stringify({
                        "geometryType": "esriGeometryPoint",
                        "geometries": [{
                            "x": fullExtent.xmin,
                            "y": fullExtent.ymin
                        }, {
                            "x": fullExtent.xmax,
                            "y": fullExtent.ymax
                        }]
                    })
                }

            };
            Request(url, options)
                .then(response => {
                    let fe = {}
                    let d = response.data;
                    fe.xmin = d.geometries[0].x;
                    fe.ymin = d.geometries[0].y;
                    fe.xmax = d.geometries[1].x;
                    fe.ymax = d.geometries[1].y;
                    fe.spatialReference = 102100
                    myMapView.extent = fe;

                })
                .catch(err => alert(err))
        }

        function buildToc(mylayer) {
            let toc = new Toc(mylayer, "toc");
            projectandZoom(mylayer.fullExtent)

        }
        /*function drawGeometry(geometry) {
            console.log("NEXT")
            let g;
            let s;
            //it is a line
            console.log(geometry)
            if (geometry.paths != undefined) {
                g = {
                    type: "polyline",
                    paths: geometry.paths
                }
                s = {
                    type: "simple-line",
                    color: "red",
                    width: 4
                };
            }
            //it is a polygon
            else if (geometry.rings != undefined) {
                g = {
                    type: "polygon",
                    rings: geometry.rings
                };
                s = {
                    type: "simple-fill",
                    style: "backward-diagonal",
                    color: "red",
                    width: 4
                }
            }
            // it is a point
            else {
                g = {
                    type: "point",
                    longitude: geometry.x,
                    latitude: geometry.y
                };
                s = {
                    type: "simple-marker",
                    color: "blue"
                };

            }
            let graphic = new Graphic({
                geometry: g,
                symbol: s
            });
            myMapView.graphics.add(graphic);
        }
*/
        function setBasemap() {
            baseMapsList = ["streets", "satellite", "hybrid", "terrain", "topo", "gray", "dark-gray", "oceans", "national-geographic", "osm", "dark-gray-vector", "gray-vector", "streets-vector", "topo-vector", "streets-night-vector", "streets-relief-vector", "streets-navigation-vector"]
            BaseMapsSet = document.getElementById("BaseMaps");
            for (i = 0; i < baseMapsList.length; i++) {
                let basemapOption = document.createElement("option");
                getRandomColor(basemapOption);
                basemapOption.setAttribute("id", baseMapsList[i]);
                basemapOption.textContent = baseMapsList[i];
                BaseMapsSet.appendChild(basemapOption);
                BaseMapsSet.style.backgroundColor = BaseMapsSet[0].style.backgroundColor
            }
            BaseMapsSet.addEventListener("change", e => map.basemap = baseMapsList[e.target.selectedIndex])
        }
        setBasemap();
        btnLoad = document.getElementById("loadService")
        btnLoad.addEventListener("click", function() {
            populateMapServices(inputID.value)
        })

        
    }
);
/*function drawPoint(x,y){

    let p = {
        type: "point",
        longitude: x,
        latitude: y
    };
    let symbol = {
        type: "simple-marker",
        color: "blue"
    };
    let graphic = new Graphic({geometry: p, symbol});
    myMapView.graphics.add(graphic);
}

function drawLine(x1,y1, x2,y2) {
    let line = {
        type: "polyline",
        paths: [
            [x1, y1],
            [x2, y2],
            [x3, y3],
            [x4, y4]
        ]
    }
    let symbol = {
        type: "simple-line",
        color: "red",
        width: 4
};
    let graphic = new Graphic({geometry: line,symbol: symbol})
    myMapView.graphics.add(graphic)
};
function drawPolygon(x1,y1, x2,y2, x3,y3){
    let polygon = {
        type: "polygon",
        rings: [
            [x1, y1],
            [x2, y2],
            [x3, y3],
            [x1, y1]
        ]
    };
    let symbol = {
        type: "simple-fill",
        color: "red",
        width: 4
};
    let graphic = new Graphic({geometry: polygon,symbol: symbol});
    myMapView.graphics.add(graphic);
};*/


//populate the attributes of a given layer



/*   function populateTOCTable(){
    let url = "https://sampleserver6.arcgisonline.com/arcgis/rest/services/?f=json";
    let options = {
        responseType: "json"
    }
    return Request(url, options).then(response => {
        var servicesList = []
        services = response.data.services;
        for (i=0;i<services.length;i++){
            if(services[i].type == "MapServer"){
            servicesList.push(services[i].name)}
        } 
        return servicesList
    })
}
*/