// src/data/countries.js
// Datos geográficos/telefónicos: claves telefónicas, documentos de identidad
// por país (CDOCS) y la lista ordenada de países (COUNTRIES). Sin dependencias.

const PHONE_CODES=[
  {c:"Antigua y Barbuda",code:"+1 268"},{c:"Argentina",code:"+54"},
  {c:"Aruba",code:"+297"},{c:"Bahamas",code:"+1 242"},
  {c:"Barbados",code:"+1 246"},{c:"Belice",code:"+501"},
  {c:"Bolivia",code:"+591"},{c:"Brasil",code:"+55"},
  {c:"Canadá",code:"+1"},{c:"Chile",code:"+56"},
  {c:"Colombia",code:"+57"},{c:"Costa Rica",code:"+506"},
  {c:"Cuba",code:"+53"},{c:"Curaçao",code:"+599"},
  {c:"Dominica",code:"+1 767"},{c:"Ecuador",code:"+593"},
  {c:"El Salvador",code:"+503"},{c:"España",code:"+34"},
  {c:"Estados Unidos",code:"+1"},{c:"Granada",code:"+1 473"},
  {c:"Guatemala",code:"+502"},{c:"Guyana",code:"+592"},
  {c:"Haití",code:"+509"},{c:"Honduras",code:"+504"},
  {c:"Jamaica",code:"+1 876"},{c:"México",code:"+52"},
  {c:"Nicaragua",code:"+505"},{c:"Panamá",code:"+507"},
  {c:"Paraguay",code:"+595"},{c:"Perú",code:"+51"},
  {c:"Puerto Rico",code:"+1 787"},{c:"Rep. Dominicana",code:"+1 809"},
  {c:"San Cristóbal y Nieves",code:"+1 869"},{c:"San Vicente",code:"+1 784"},
  {c:"Santa Lucía",code:"+1 758"},{c:"Surinam",code:"+597"},
  {c:"Trinidad y Tobago",code:"+1 868"},{c:"Uruguay",code:"+598"},
  {c:"Venezuela",code:"+58"},
];

const CDOCS={
  "México":{l:"CURP",f:"Clave Única de Registro de Población",ph:"LOAM931018HDFRRS01"},
  "Argentina":{l:"DNI",f:"Documento Nacional de Identidad",ph:"12.345.678"},
  "España":{l:"DNI/NIE",f:"Documento Nacional de Identidad / NIE",ph:"12345678Z"},
  "Colombia":{l:"Cédula",f:"Cédula de Ciudadanía",ph:"1234567890"},
  "Chile":{l:"RUT",f:"Rol Único Tributario",ph:"12.345.678-9"},
  "Perú":{l:"DNI",f:"Documento Nacional de Identidad",ph:"12345678"},
  "Venezuela":{l:"CI",f:"Cédula de Identidad",ph:"V-12345678"},
  "Ecuador":{l:"CI",f:"Cédula de Identidad",ph:"1234567890"},
  "Bolivia":{l:"CI",f:"Cédula de Identidad",ph:"1234567"},
  "Paraguay":{l:"CI",f:"Cédula de Identidad",ph:"1234567"},
  "Uruguay":{l:"CI",f:"Cédula de Identidad",ph:"1.234.567-8"},
  "Brasil":{l:"CPF",f:"Cadastro de Pessoas Físicas",ph:"123.456.789-09"},
  "Cuba":{l:"CI",f:"Carnet de Identidad",ph:"90123456789"},
  "Rep. Dominicana":{l:"CIE",f:"Cédula de Identidad y Electoral",ph:"001-1234567-1"},
  "Guatemala":{l:"DPI",f:"Documento Personal de Identificación",ph:"1234 12345 1234"},
  "Honduras":{l:"DNI",f:"Tarjeta de Identidad Nacional",ph:"0101-1990-12345"},
  "El Salvador":{l:"DUI",f:"Documento Único de Identidad",ph:"00123456-7"},
  "Nicaragua":{l:"CI",f:"Cédula de Identidad Ciudadana",ph:"001-010190-0001X"},
  "Costa Rica":{l:"CI",f:"Cédula de Identidad",ph:"1-0123-0456"},
  "Panamá":{l:"CI",f:"Cédula de Identidad Personal",ph:"8-123-4567"},
  "Estados Unidos":{l:"SSN",f:"Social Security Number o State ID",ph:"123-45-6789"},
  "Canadá":{l:"SIN",f:"Social Insurance Number",ph:"123 456 789"},
  "Puerto Rico":{l:"SSN",f:"Social Security Number",ph:"123-45-6789"},
  "Haití":{l:"CIN",f:"Carte d'Identification Nationale",ph:"123-456-789-0"},
  "Jamaica":{l:"TRN",f:"Tax Registration Number",ph:"123-456-789"},
  "Trinidad y Tobago":{l:"ID Card",f:"National ID Card",ph:"12345678901"},
};

const COUNTRIES=Object.keys(CDOCS).sort();


const COUNTRY_ISO={
  "México":"MX","Argentina":"AR","Bolivia":"BO","Brasil":"BR","Canadá":"CA",
  "Chile":"CL","Colombia":"CO","Costa Rica":"CR","Cuba":"CU","Ecuador":"EC",
  "El Salvador":"SV","España":"ES","Estados Unidos":"US","Guatemala":"GT",
  "Haití":"HT","Honduras":"HN","Jamaica":"JM","Nicaragua":"NI","Panamá":"PA",
  "Paraguay":"PY","Perú":"PE","Puerto Rico":"PR","Rep. Dominicana":"DO",
  "Trinidad y Tobago":"TT","Uruguay":"UY","Venezuela":"VE","Antigua y Barbuda":"AG",
  "Aruba":"AW","Bahamas":"BS","Barbados":"BB","Belice":"BZ","Dominica":"DM",
  "Granada":"GD","Groenlandia":"GL","Guyana":"GY","Surinam":"SR",
};

const ROLE_PREFIX={
  catecumeno:"CTM",prebautismal:"FAM",padrino:"PDR",
  catequista:"CTQ",parroquia:"PAR",diocesis:"DIO"
};

function genRegistrationId(country,userType){
  const cc=COUNTRY_ISO[country]||"XX";
  const rp=ROLE_PREFIX[userType]||"USR";
  const yr=String(new Date().getFullYear()).slice(-2);
  const isInst=userType==="parroquia"||userType==="diocesis";
  const maxNum=isInst?899:8999;
  const startNum=isInst?100:1000;
  const seq=startNum+Math.floor(Math.random()*maxNum);
  const seqStr=String(seq);
  return `${cc}-${rp}-${yr}-${seqStr}`;
}

export { PHONE_CODES, CDOCS, COUNTRIES, COUNTRY_ISO, ROLE_PREFIX, genRegistrationId };
