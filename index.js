// const form = document.querySelector('#fileUpload')

let previousData = localStorage.getItem('db') || `[{"id":"1"}]`;
let previousKeys = localStorage.getItem('previousKeys') || `["id"]`;
let arrayData = JSON.parse(previousData)
let keys = JSON.parse(previousKeys)
let fileName = localStorage.getItem('fileName') || `csvFile`
document.querySelector('#fileName').innerText = fileName;
createTable(arrayData)

// load csv
document.getElementById('myFile')
            .addEventListener('change', function() {

            var fr=new FileReader();
            fr.onload=function(){
              const importedData = serialize(fr.result)
              keys = Object.keys(importedData[0])
              createTable(importedData)
              const fileName = document.getElementById('myFile').files[0].name.replaceAll('.csv', '');
              document.getElementById('fileName').innerText = fileName;
              localStorage.setItem('fileName', fileName);
              save(importedData)
            }

            fr.readAsText(this.files[0]);
        })

function convertKey(string) {
  return string.toLowerCase()
          .trim()
          .replaceAll(/[- \n]/g, '_')
          .replaceAll('"', '')
}

function commaHandler(string) {
  if (string.includes('$commaSpace$')) {
    return string.replaceAll('$commaSpace$', ', ')
                 .replaceAll('$commaBreak$', ',\n')
  } else {
    return string.replaceAll(', ', '$commaSpace$')
                 .replaceAll(',\n', '$commaBreak$')
  }
}

function serialize(string) {
  const dataObjArray = []
  const arrayData = string.split(/\r\n/);
  const keys = commaHandler(arrayData[0]).split(',')
                                         .map(key=>convertKey(commaHandler(key)))
  const data = arrayData.slice(1);

  data.forEach((row) => {
    dataObj = {}
    row = commaHandler(row).split(',')
    row.forEach((value, index)=>{
      dataObj[keys[index]] = commaHandler(value)
    })
    dataObjArray.push(dataObj)
  })

  save(dataObjArray)
  return dataObjArray
}

function save(dataObjArray) {
  localStorage.setItem('db', JSON.stringify(dataObjArray))
  previousData = JSON.stringify(dataObjArray);
  arrayData = dataObjArray
  keys = Object.keys(dataObjArray[0]);
  localStorage.setItem('previousKeys', JSON.stringify(keys))
}

function newTable() {
  if (confirm('New table?')) {
    previousData = `[{"id":"1"}]`;
    arrayData = [{id:1}];
    keys = ['id']
    localStorage.setItem('previousKeys', JSON.stringify(keys))
    createTable(arrayData)
    save(arrayData)
  }
}

function deserialize(arrayObj) {
  const array = []
  array.push(keys);
  arrayObj.forEach((obj)=>{
    const values = keys.map(key=>obj[key]).join()
    array.push(values)
  })
  return array.join('\r\n')
}

function createTable(arrayObj) {
  const table = document.createElement('table');
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `${keys.map((key)=>`<th${key == 'id' ? '' : ` id="${convertKey(key)}" contenteditable="true" class="textarea" onblur="updateKey(this)"`}>${key.replaceAll('_', ' ').toUpperCase()}</th>`).join('')}<th class="add-btn" role="button" tabindex="0" onclick="addColumn()">+</th>`;
  let html = `${arrayObj.map(obj => createRow(obj, keys)).join('')}<tr><td class="add-btn" role="button" tabindex="0" onclick="addRow()">+</td></tr>`;
  if (arrayObj.length == 1) {
    html = html.replaceAll(`<td role="button" tabindex="0" class="minus-btn" onclick="removeRow(${arrayObj[0].id})">-</td>`, '')
  }
  table.append(headerRow)
  table.insertAdjacentHTML('beforeend', html);
  document.querySelector('#output').innerHTML = '';
  document.querySelector('#output').append(table);
  addRemoveBtns = document.querySelectorAll('.add-btn, .minus-btn');
  addRemoveBtns.forEach((btn)=>{
    btn.addEventListener('keyup', (e) => {
      if (e.key == 'Enter') {
        e.target.click()
      }
    });
  })
}

function createRow(obj, keys) {
  const rowCells = keys.map((key)=>createCell(obj, key))
  const removeBtn = `<td role="button" tabindex="0" class="minus-btn" onclick="removeRow(${obj.id})">-</td>`
  return `<tr>${rowCells.join('')}${removeBtn}</tr>`
}

function createCell(obj, key) {
  return `<td id="${key}-${obj.id}"${key == 'id' ? '' : ' contenteditable="true" class="textarea" onfocus="addListener(this)" onblur="removeListener(this)"'}>${obj[key]}</td>`
}

function addListener(el) {
  el.addEventListener('keyup', (e)=>{
    const el = e.target;
    const [key, id] = el.id.split('-');
    if (key && id) {
      arrayData.find(row=>row.id == id)[key] = el.innerText;
      save(arrayData)
    }
  })
}

function removeListener(el) {
  el.removeEventListener('keyup', (e)=>{
    const el = e.target;
    const [key, id] = el.id.split('-');
    if (key && id) {
      arrayData.find(row=>row.id == id)[key] = el.innerText;
      save(arrayData)
    }
  })
}

function updateKey(el) {
  let currentKeys = Array.from(document.querySelectorAll('th')).slice(0, -1).map(th=>convertKey(th.innerText))
  const oldKey = el.id;
  let key = convertKey(el.innerText)

  if (oldKey == key) return

  if (currentKeys.filter(cKey=>cKey == key).length > 1) {
    key = oldKey
    el.innerText = oldKey.replaceAll('_', ' ').toUpperCase();
    alert('Header already in use.')
    return
  }

  if (key == '') {
    if (confirm("Delete header?")) {
      currentKeys = currentKeys.filter(key=>key !== '')
    } else {
      key = oldKey
      el.innerText = oldKey.replaceAll('_', ' ').toUpperCase();
    }
  } else {
    arrayData.forEach((obj)=>{
      if (key !== oldKey) {
        if (key !== '') obj[key] = obj[oldKey]
        delete obj[oldKey]
      }
    })
  }
  save(arrayData);

  localStorage.setItem('previousKeys', JSON.stringify(currentKeys))
  keys = currentKeys
  createTable(arrayData);
}

function download() {
  const fileName = document.getElementById('fileName').innerText.replaceAll('.csv', '') || 'file.csv';
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(deserialize(arrayData)));
  element.setAttribute('download', `${fileName}.csv`);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function addColumn() {
  let key = prompt("Column name", `new_column_${Object.keys(arrayData[0]).length}`);
  if (key !== null && key !== "" && !keys.includes(key)) {
    arrayData.forEach((objRow)=>objRow[key] = '');
    keys.push(convertKey(key))
    localStorage.setItem('previousKeys', JSON.stringify(keys))
    createTable(arrayData);
    save(arrayData);
  } else {
    alert('Invalid name.')
  }
}

function addRow() {
  const lastRow = arrayData[arrayData.length - 1]
  const newRow = {}
  for (const key in lastRow) {
    newRow[key] = (key == 'id') ? Number(lastRow.id) + 1 :  ''
  }
  arrayData.push(newRow);
  createTable(arrayData);
  save(arrayData);
}

function removeRow(id) {
  if (confirm('Delete row?')) {
    const rowToDelete = arrayData.find((obj)=>obj.id == id)
    const index = arrayData.indexOf(rowToDelete)
    arrayData.splice(index, 1);
    createTable(arrayData);
    save(arrayData);
  }
}
