module.exports = async function getSpreadsheetData(doc, sheetIndex = 0, offset = false, limit = false, editable = false, appendable = false) {
  
  try {
    // Authenticate with Google
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY,
    });

    // Load doc, sheet and sheet headers
    await doc.loadInfo();

    const sheet = doc.sheetsByIndex[sheetIndex];
    
    if (appendable) {
      return sheet;
    }
    
    await sheet.loadHeaderRow();
    
    // Set options for getRows()
    let options = {};
    if (offset !== false && limit !== false) {
      options.offset = offset;
      options.limit = limit;
    }

    // Get relevent rows
    const rows = await sheet.getRows(options);
    
    // Return GoogleSheets object for editable actions
    if (editable) {
      return rows;
    }
    
    // Construct sheeData object for read only
    let sheetData = {
      docTitle: doc.title,
      title: sheet.title
    }
    
    // Parse GoogleSheets object into flat JSON
    const headers = sheet.headerValues;
    sheetData.rows =  await parseSpreadsheetData(rows, headers);
    sheetData.rows = sheetData.rows.filter(i => i["Reviewed"] === "Yes" ? i : null)
    
    // Return flat JSON for read only
    return sheetData
    
  } catch (error) {
    console.log("Error:");
    console.log(error);
    return false;
  }
}


async function parseSpreadsheetData(rows, headers) {
  return rows.map(i => {
    let rowData = {
      rowId: i.rowNumber
    }
    headers.forEach(j => {
      rowData[j] = parseCell(i[j], j);
    })
    return rowData;
  });
}


function parseCell(cell, header) {
  // This is an empty cell
  if (!cell) {
    return '';
    
  // This is a cell with an attachment 
  } else if (cell.substring(0, 30) === 'https://drive.google.com/open?') {
    
    const attachmentType = guessAttachment(header.toLowerCase());
    
    if (attachmentType) {
      const links = cell.split(",");
      
      const linksArray = links.map(i => i.split('=')[1]);
      
      const cellObject = {};
      cellObject[attachmentType] = true;
      cellObject.urls = linksArray;
      
      return cellObject;
      
    } else {
      return cell
    }
   
  // This is a cell with a list of links  
  } else if (guessAttachment(header.toLowerCase()) === "links") {
    return cell.split("\n").join(", ").split(",").map(i => i.trim()).map(i => i.indexOf("http") === 0 ? {url:i, original: i} : {url: "http://" + i, original: i});
  } else {
    return cell;
  }
}


function guessAttachment(header) {
  
  const isInHeader = isIn.bind(this, header);
  
  if (
    isInHeader("photo") ||
    isInHeader("picture") ||
    isInHeader("image")
  ) {
    return "images"
  } else if (
    isInHeader("slide") ||
    isInHeader("presentation") ||
    isInHeader("deck")
  ) {
    return "slides"
  } else if (
    isInHeader("video") ||
    isInHeader("movie")
  ) {
    return "video"
  } else if (
    isInHeader("audio") ||
    isInHeader("mp3") ||
    isInHeader("song") ||
    isInHeader("podcast")
  ) {
    return "audio"
  } else if (
    isInHeader("links") ||
    isInHeader("urls")
  ) {
    return "links"
  } else {
    return false;
  }
  
}

function isIn(fullText, text) {
  if (fullText.indexOf(text) >= 0) {
    return true;
  } else {
    return false;
  }
}