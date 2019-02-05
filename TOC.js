class Toc {
    constructor (mapServiceLayer, tocElementString) {
        this.tocElement = document.getElementById(tocElementString);
        let toc = this.tocElement
        toc.innerHTML = "";
        let layerList = document.createElement("ul");
        toc.appendChild(layerList);
        this.populateLayerRecursive(mapServiceLayer, layerList);    
    }
        populateLayerRecursive(thislayer, layerList) {
        //create checkbox
        let chk = document.createElement("input");
        chk.type = "checkbox";
        chk.value = thislayer.id;
        chk.checked = thislayer.visible;
        chk.addEventListener("click", e => thislayer.visible = e.target.checked)
        //create label
        let lbl = document.createElement("label");
        lbl.textContent = thislayer.title;
        let btn = document.createElement("button")
        //create button
        btn.textContent = "View";
        //getCount(thislayer.id,btn)
        //on click, call populateAttributeTable
        btn.addEventListener("click",this.openAttributeTable)
        btn.layerid = thislayer.id;
        btn.layerURL = thislayer.url;
        let layerItem = document.createElement("li")
        //add checkbox, label, button
        layerItem.appendChild(chk);
        layerItem.appendChild(lbl);
        layerItem.appendChild(btn);
        layerList.appendChild(layerItem);
        if (thislayer.sublayers != null) {
            let newList = document.createElement("ul");
            layerList.appendChild(newList);
            for (let i = 0; i < thislayer.sublayers.length; i++) {
                this.populateLayerRecursive(thislayer.sublayers.items[i], newList);
            }
        }
    }
    openAttributeTable(e){
        let attributeTable = new AttributeTable(e.target.layerURL,  e.target.mapview)
    }
}