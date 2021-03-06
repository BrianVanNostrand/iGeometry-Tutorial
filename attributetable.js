class AttributeTable{

    constructor (mapserviceLayerUrl) {
        this.buttonPages =[];
        this.mapserviceLayerUrl = mapserviceLayerUrl + "/";
        this.getCount()
        .then (c => {  
            this.populatePages(c);
            this.populateAttributesTable(1, c)
        })
        .catch (err => alert("error! " + err))

    }

resetPages()
{
    this.buttonPages.forEach(b => {
        b.style.color = "black";
    })
}

getCount()
{	

    return new Promise((resolve, reject) => {

        //mapservice url sample "https://sampleserver6.arcgisonline.com/arcgis/rest/services/" + selectedService + "/MapServer/"
        let queryurl = this.mapserviceLayerUrl + "query";

        let queryOptions = {
                            responseType: "json",
                            query:  
                            {
                                f: "json",
                                where:"1=1",
                                returnCountOnly: true
                            }
                            }

        Request(queryurl,queryOptions)
        .then (response => resolve(response.data.count))
        .catch (err => reject (0));
     }
    );
           
    }
    populatePages(featureCount)
    {
        let pagesCount = Math.ceil(featureCount / DEFAULT_PAGE_SIZE);
        let pagesDiv = document.getElementById("Pages");
        pagesDiv.innerHTML = "";
        let AttributeTableinstance = this;
        for (let i = 0; i < pagesCount; i++)
        {
            let page = document.createElement("button");
            page.textContent = i+1;
            this.buttonPages.push(page);
            page.attributeTable = this;
            page.pageNumber = i+1;
            page.featureCount  = featureCount;
            page.addEventListener("click", function (e) {
                                AttributeTableinstance.resetPages();
                                e.target.style.color = "red";
                                AttributeTableinstance.populateAttributesTable(i+1, featureCount);
                            }
            );
    
            pagesDiv.appendChild(page);
        }
        //alert("Page count : " + pagesCount );
    
    }

    Zoom (e) {
        let oid = e.target.oid;
        let url  = e.target.url;
        
        //mapservice url sample "https://sampleserver6.arcgisonline.com/arcgis/rest/services/" + selectedService + "/MapServer/"
        let queryurl = url + "query";
    
        let queryOptions = {
                                responseType: "json",
                                query:  
                                {
                                    f: "json",
                                    objectIds: oid,
                                    returnGeometry: true,
                                    outSR: 4326
                                }
                                }
    
            Request(queryurl,queryOptions)
            .then (response => {
                drawGeometry(response.data.features[0].geometry);
            })
            .catch (err => reject (alert ("ERR: " + err)));	
    
    }
    
    populateAttributesTable(page, featureCount)
    {
        //alert (featureCount);
        let queryurl = this.mapserviceLayerUrl + "query";
    
        let attributetable = document.getElementById("AttributeTable");
        attributetable.innerHTML ="Attribute Table ";
    
        let queryOptions = {
                             responseType: "json",
                             query:  
                             {
                                f: "json",
                                where:"1=1",
                                returnCountOnly: false,
                                outFields: "*",
                                resultOffset: (page - 1) * DEFAULT_PAGE_SIZE + 1,
                                resultRecordCount: DEFAULT_PAGE_SIZE
                             }
                            }
    
             Request(queryurl,queryOptions).then (response => 
             {
    
                 //alert(response.data.fields.length);
                 let table = document.createElement("table");
                 table.setAttribute("id", "AttributeRows")
                 let header = document.createElement("tr");
                 table.appendChild(header);
                 let zoomHeader = document.createElement("th");
                 zoomHeader.textContent = "Zoom"
                 header.appendChild(zoomHeader)
                 //populate the fields/ columns
                 for (let i = 0; i < response.data.fields.length; i++)
                 {
                    let column = document.createElement("th");
                    column.textContent = response.data.fields[i].alias;
                    header.appendChild(column);
                 }
    
                 //loop through all features
    
    
    
                 for (let j = 0; j < response.data.features.length; j++)
                 {
                     let feature = response.data.features[j];
                     let row = document.createElement("tr");
                     let zoomColumn = document.createElement("td");
                     zoomColumn.textContent = "zoom"
                     zoomColumn.addEventListener("click", this.Zoom)
                     
                     zoomColumn.url = this.mapserviceLayerUrl
                     row.appendChild(zoomColumn)
                     table.appendChild(row);
                     for (let i = 0; i < response.data.fields.length; i++)
                     {
                         let field = response.data.fields[i];
    
                        let column = document.createElement("td");
                        if (field.type === "esriFieldTypeOID"){
                            zoomColumn.oid =feature.attributes[field.name]; 
                        }
    
                        if (field.type == "esriFieldTypeDate")
                        {
                            let d = new Date(feature.attributes[field.name]);
                            column.textContent = d;
                        }	 
                        else
                            column.textContent = feature.attributes[field.name];
    
                        row.appendChild(column);
                     }
    
                 }
    
    
                 attributetable.appendChild(table);

             }, response => el.style.visibility="hidden" );
    
    
    }
    }