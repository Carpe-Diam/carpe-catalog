const XLSX = require('xlsx');
const path = require('path');

const excelPath = 'c:\\Users\\jaytc\\OneDrive\\Desktop\\projects\\carpe-catalog\\frontend\\Link data.xlsx';

try {
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log('Headers:', Object.keys(data[0] || {}));
    console.log('Total Rows:', data.length);
    console.log('First 3 Rows:', JSON.stringify(data.slice(0, 3), null, 2));
} catch (error) {
    console.error('Error reading Excel:', error);
}
