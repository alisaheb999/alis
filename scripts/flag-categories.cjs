// Category map for the flag pack stored in the `ghost-assets` bucket.
// key = file base name (without .png), value = folder name inside `flags/`
const AFRICA = ['Algeria','Angola','Benin','Botswana','Burkina-Faso','Burundi','Cameroon','Canary-Islands','Cape-Verde','Central-African-Republic','Chad','Comoros','Democratic-Republic-of-Congo','Djibouti','Egypt','Equatorial-Guinea','Eritrea','Eswatini','Ethiopia','Gabon','Gambia','Ghana','Guinea','Guinea-Bissau','Ivory-Coast','Kenya','Lesotho','Liberia','Libya','Madagascar','Malawi','Mali','Mauritania','Mauritius','Mayotte','Morocco','Mozambique','Namibia','Niger','Nigeria','Republic-of-Congo','Reunion','Rwanda','Saint-Helena','Sao-Tome-and-Principe','Senegal','Seychelles','Sierra-Leone','Somalia','South-Africa','South-Sudan','Sudan','Tanzania','Togo','Tunisia','Uganda','Western-Sahara','Zambia','Zimbabwe'];

const AMERICAS = ['Anguilla','Antigua-and-Barbuda','Argentina','Aruba','Bahamas','Barbados','Belize','Bermuda','Bolivia','Bonaire','Brazil','British-Virgin-Islands','Canada','Cayman-Islands','Chile','Colombia','Costa-Rica','Cuba','Curacao','Dominica','Dominican-Republic','Ecuador','El-Salvador','Falkland-Islands','French-Guiana','Greenland','Grenada','Guadeloupe','Guatemala','Guyana','Haiti','Honduras','Jamaica','Martinique','Mexico','Montserrat','Nicaragua','Panama','Paraguay','Peru','Puerto-Rico','Saint-Barthelemy','Saint-Kitts-and-Nevis','Saint-Lucia','Saint-Martin','Saint-Pierre-and-Miquelon','Saint-Vincent','Sint-Maarten','South-Georgia','Suriname','Trinidad-and-Tobago','Turks-and-Caicos','United-States','Uruguay','US-Outlying-Islands','US-Virgin-Islands','Venezuela'];

const ASIA = ['Afghanistan','Armenia','Azerbaijan','Bahrain','Bangladesh','Bhutan','British-Indian-Ocean-Territory','Brunei','Cambodia','China','Christmas-Island','Cocos-Islands','Cyprus','Diego-Garcia','Georgia','Hong-Kong','India','Indonesia','Iran','Iraq','Israel','Japan','Jordan','Kazakhstan','Kuwait','Kyrgyzstan','Laos','Lebanon','Macau','Malaysia','Maldives','Mongolia','Myanmar','Nepal','North-Korea','Oman','Pakistan','Palestine','Philippines','Qatar','Saudi-Arabia','Singapore','South-Korea','Sri-Lanka','Syria','Taiwan','Tajikistan','Thailand','Timor-Leste','Turkey','Turkmenistan','United-Arab-Emirates','Uzbekistan','Vietnam','Yemen'];

const EUROPE = ['Aland-Islands','Albania','Andorra','Austria','Belarus','Belgium','Bosnia-and-Herzegovina','Bulgaria','Croatia','Czech-Republic','Denmark','England','Estonia','Faroe-Islands','Finland','France','Germany','Gibraltar','Greece','Guernsey','Hungary','Iceland','Ireland','Isle-of-Man','Italy','Jersey','Kosovo','Latvia','Liechtenstein','Lithuania','Luxembourg','Malta','Moldova','Monaco','Montenegro','Netherlands','North-Macedonia','Northern-Ireland','Norway','Poland','Portugal','Romania','Russia','San-Marino','Scotland','Serbia','Slovakia','Slovenia','Spain','Svalbard-and-Jan-Mayen','Sweden','Switzerland','Ukraine','United-Kingdom','Vatican-City','Wales','es-ct@1x','es-ga@1x','es-pv@1x'];

const OCEANIA = ['American-Samoa','Australia','Cook-Islands','Fiji','French-Polynesia','Guam','Kiribati','Marshall-Islands','Micronesia','Nauru','New-Caledonia','New-Zealand','Niue','Norfolk-Island','Northern-Mariana-Islands','Palau','Papua-New-Guinea','Pitcairn-Islands','Samoa','Solomon-Islands','Tokelau','Tonga','Tuvalu','Vanuatu','Wallis-and-Futuna'];

const ORGANIZATIONS = ['Arab-League','ASEAN','cefta@1x','East-African-Community','European-Union','Pacific-Islands','United-Nations'];

const OTHER = ['Antarctica','Bouvet-Island','French-Southern-Territories','Heard-Island','xx@1x','cp@1x','sh-ac@1x','sh-hl@1x','sh-ta@1x'];

const MAP = {};
const add = (list, region) => list.forEach((n) => { MAP[n] = region; });
add(AFRICA, 'africa');
add(AMERICAS, 'americas');
add(ASIA, 'asia');
add(EUROPE, 'europe');
add(OCEANIA, 'oceania');
add(ORGANIZATIONS, 'organizations');
add(OTHER, 'other');

module.exports = MAP;
module.exports.GROUPS = { africa: AFRICA, americas: AMERICAS, asia: ASIA, europe: EUROPE, oceania: OCEANIA, organizations: ORGANIZATIONS, other: OTHER };
