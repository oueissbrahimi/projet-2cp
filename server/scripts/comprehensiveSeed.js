const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const prisma = require('../config/prismaClient');
const P = 'demo+';
const DP = process.env.SEED_TEST_PASSWORD || 'Test123456';
const toD = (o) => { const d = new Date(); d.setDate(d.getDate() + o); return d; };

const users = [
  {e:`${P}admin@b.c`,ph:'0550000000',t:'INDIVIDUAL',r:'ADMIN',s:'ACTIVE',pr:{k:'individual',fn:'System Admin',ni:'900000000000000000',lo:'Algiers'},tr:'BUSINESS',sc:0,rc:0,cc:0},
  {e:`${P}a@b.c`,ph:'0550000001',t:'INDIVIDUAL',r:'USER',s:'ACTIVE',pr:{k:'individual',fn:'Ahmed Benali',ni:'900000000000000001',lo:'Algiers'},tr:'FREE',sc:3,rc:2,cc:1},
  {e:`${P}f@b.c`,ph:'0550000002',t:'INDIVIDUAL',r:'USER',s:'ACTIVE',pr:{k:'individual',fn:'Fatima Zerhouni',ni:'900000000000000002',lo:'Oran'},tr:'FREE',sc:4,rc:4,cc:2},
  {e:`${P}m@b.c`,ph:'0550000003',t:'INDIVIDUAL',r:'USER',s:'ACTIVE',pr:{k:'individual',fn:'Mohamed Kaddour',ni:'900000000000000003',lo:'Constantine'},tr:'INDIVIDUAL',sc:5,rc:3,cc:8},
  {e:`${P}am@b.c`,ph:'0550000004',t:'INDIVIDUAL',r:'USER',s:'ACTIVE',pr:{k:'individual',fn:'Amina Bouazza',ni:'900000000000000004',lo:'Annaba'},tr:'INDIVIDUAL',sc:7,rc:5,cc:14},
  {e:`${P}k@b.c`,ph:'0550000005',t:'INDIVIDUAL',r:'USER',s:'ACTIVE',pr:{k:'individual',fn:'Karim Hadjadji',ni:'900000000000000005',lo:'Setif'},tr:null,sc:0,rc:0,cc:0},
  {e:`${P}s@b.c`,ph:'0550000006',t:'INDIVIDUAL',r:'USER',s:'ACTIVE',pr:{k:'individual',fn:'Sara Merad',ni:'900000000000000006',lo:'Blida'},tr:null,sc:0,rc:0,cc:0},
  {e:`${P}at@b.c`,ph:'0550000007',t:'BUSINESS',r:'USER',s:'ACTIVE',pr:{k:'business',bn:'Atlas Logistics',rc:'259999Z99',fo:'SPA',nf:'001234567890123',ns:'001234567890123',ls:['Algiers','Oran','Constantine','Annaba']},tr:'BUSINESS',sc:10,rc:8,cc:20},
  {e:`${P}fa@b.c`,ph:'0550000008',t:'BUSINESS',r:'USER',s:'ACTIVE',pr:{k:'business',bn:'Fast Transport',rc:'258888Y88',fo:'SARL',nf:'009876543210987',ns:'009876543210987',ls:['Oran','Mostaganem','Chlef','Tlemcen']},tr:'BUSINESS',sc:8,rc:6,cc:15},
  {e:`${P}no@b.c`,ph:'0550000009',t:'BUSINESS',r:'USER',s:'ACTIVE',pr:{k:'business',bn:'Nord Fret',rc:'257777X77',fo:'EURL',nf:'004567890123456',ns:'004567890123456',ls:['Annaba','Skikda','Jijel','Constantine']},tr:'BUSINESS',sc:12,rc:10,cc:18},
];

const vehicles = [
  {pl:'90001-001-16',em:`${P}a@b.c`,n:'Renault Kangoo',ty:'Small Van',cl:'White',yr:2021,cp:0.8,ph:'/uploads/seed-kangoo.jpg',st:'AVAILABLE'},
  {pl:'90002-002-16',em:`${P}m@b.c`,n:'Citroen Berlingo',ty:'Fourgon',cl:'Blue',yr:2022,cp:1.2,ph:'/uploads/seed-berlingo.jpg',st:'AVAILABLE'},
  {pl:'90003-003-16',em:`${P}f@b.c`,n:'Frigo Truck',ty:'Refrigerated Truck',cl:'White',yr:2020,cp:5,ph:'/uploads/seed-frigo.jpg',st:'AVAILABLE'},
  {pl:'90004-004-16',em:`${P}am@b.c`,n:'Iveco Daily',ty:'Dropside Truck',cl:'Red',yr:2021,cp:7,ph:'/uploads/seed-iveco.jpg',st:'AVAILABLE'},
  {pl:'90005-005-16',em:`${P}at@b.c`,n:'Volvo FH16',ty:'Semi-trailer',cl:'Blue',yr:2022,cp:24,ph:'/uploads/seed-volvo.jpg',st:'AVAILABLE'},
  {pl:'90006-006-16',em:`${P}fa@b.c`,n:'Mercedes Actros',ty:'Container Truck',cl:'Silver',yr:2023,cp:26,ph:'/uploads/seed-actros.jpg',st:'AVAILABLE'},
  {pl:'90007-007-16',em:`${P}no@b.c`,n:'Scania R450',ty:'Bulk Carrier',cl:'Orange',yr:2022,cp:22,ph:'/uploads/seed-scania.jpg',st:'AVAILABLE'},
];

const shipments = [
  {e:`${P}a@b.c`,t:'Office furniture',pt:'Furniture',pv:'Fourgon',o:'Algiers',d:'Blida',v:8,w:0.5,q:15,pr:15000,dt:toD(2),tm:'10:00',prr:'Normal',st:'PENDING',si:'Elevator available'},
  {e:`${P}a@b.c`,t:'Electronics',pt:'Electronics',pv:'Fourgon',o:'Algiers',d:'Boumerdes',v:3,w:0.2,q:50,pr:8000,dt:toD(1),tm:'14:30',prr:'High',st:'PENDING',si:'Fragile'},
  {e:`${P}a@b.c`,t:'Household goods',pt:'Household',pv:'Fourgon',o:'Algiers',d:'Tipaza',v:5,w:0.35,q:20,pr:12000,dt:toD(3),tm:'09:00',prr:'Normal',st:'PENDING',si:null},
  // Karim presentation corridor: western origins, central road stops, eastern destinations.
  {e:`${P}a@b.c`,t:'Retail pallets',pt:'Industrial / Bulk',pv:'Semi-trailer',o:'Oran',d:'Constantine',v:18,w:6,q:120,pr:52000,dt:toD(2),tm:'07:00',prr:'Normal',st:'PENDING',si:'Available for direct eastbound delivery'},
  {e:`${P}f@b.c`,t:'Cold chain produce',pt:'Perishables / Food',pv:'Refrigerated Truck',o:'Mostaganem',d:'Jijel',v:7,w:1.1,q:90,pr:34000,dt:toD(4),tm:'05:30',prr:'Urgent',st:'PENDING',si:'Keep at 4C'},
  {e:`${P}f@b.c`,t:'Construction bundles',pt:'Construction Materials',pv:'Dropside Truck',o:'Mascara',d:'Skikda',v:12,w:4.5,q:60,pr:41000,dt:toD(5),tm:'08:15',prr:'Normal',st:'PENDING',si:'Loading from warehouse A'},
  {e:`${P}m@b.c`,t:'Packaging stock',pt:'Industrial / Bulk',pv:'Fourgon',o:'Chlef',d:'Constantine',v:9,w:2.2,q:140,pr:28000,dt:toD(3),tm:'09:20',prr:'High',st:'PENDING',si:'Can fit on a partial load'},
  {e:`${P}am@b.c`,t:'Retail displays',pt:'Furniture',pv:'Flatbed Truck',o:'Tipaza',d:'Jijel',v:11,w:3.8,q:35,pr:46000,dt:toD(6),tm:'10:45',prr:'Normal',st:'IN_TRANSIT',si:'Fragile items, no rain exposure'},
  {e:`${P}at@b.c`,t:'Mixed cargo',pt:'Electronics',pv:'Semi-trailer',o:'Blida',d:'Skikda',v:20,w:5.5,q:75,pr:63000,dt:toD(1),tm:'06:40',prr:'High',st:'PENDING',si:'Matches Karim backhaul search'},
  {e:`${P}fa@b.c`,t:'Fast moving goods',pt:'Food',pv:'Fourgon',o:'Algiers',d:'Jijel',v:6,w:0.9,q:110,pr:36000,dt:toD(2),tm:'13:10',prr:'Normal',st:'PENDING',si:'Good for chat demo and contact lookup'},
  {e:`${P}no@b.c`,t:'East corridor cargo',pt:'Industrial / Bulk',pv:'Semi-trailer',o:'Oran',d:'Skikda',v:22,w:7.5,q:80,pr:71000,dt:toD(7),tm:'04:50',prr:'Urgent',st:'PENDING',si:'Long-haul eastbound option'},
  {e:`${P}f@b.c`,t:'Fresh vegetables',pt:'Perishables / Food',pv:'Refrigerated Truck',o:'Oran',d:'Mostaganem',v:6,w:1.2,q:100,pr:25000,dt:toD(1),tm:'06:00',prr:'Urgent',st:'PENDING',si:'Keep at 4C'},
  {e:`${P}f@b.c`,t:'Dairy products',pt:'Perishables / Food',pv:'Refrigerated Truck',o:'Oran',d:'Chlef',v:4,w:0.8,q:80,pr:18000,dt:toD(2),tm:'07:30',prr:'High',st:'PENDING',si:'Keep at 2C'},
  {e:`${P}f@b.c`,t:'Frozen meat',pt:'Perishables / Food',pv:'Refrigerated Truck',o:'Oran',d:'Tlemcen',v:8,w:1.5,q:120,pr:35000,dt:toD(4),tm:'05:00',prr:'Urgent',st:'PENDING',si:'Keep at -18C'},
  {e:`${P}f@b.c`,t:'Bakery supplies',pt:'Food',pv:'Fourgon',o:'Oran',d:'Sidi Bel Abbes',v:5,w:0.6,q:40,pr:14000,dt:toD(3),tm:'08:00',prr:'Normal',st:'PENDING',si:null},
  {e:`${P}m@b.c`,t:'Construction materials',pt:'Construction Materials',pv:'Camion Benne',o:'Constantine',d:'Batna',v:15,w:5,q:200,pr:45000,dt:toD(5),tm:'08:00',prr:'Normal',st:'PENDING',si:'Unloading on site'},
  {e:`${P}m@b.c`,t:'Steel beams',pt:'Construction Materials',pv:'Semi-trailer',o:'Constantine',d:'Skikda',v:25,w:8,q:50,pr:75000,dt:toD(7),tm:'10:00',prr:'High',st:'PENDING',si:'Crane needed'},
  {e:`${P}m@b.c`,t:'Cement bags',pt:'Construction Materials',pv:'Camion Benne',o:'Constantine',d:'Oum El Bouaghi',v:20,w:10,q:400,pr:55000,dt:toD(3),tm:'07:00',prr:'Normal',st:'PENDING',si:null},
  {e:`${P}m@b.c`,t:'Industrial equipment',pt:'Industrial / Bulk',pv:'Semi-trailer',o:'Constantine',d:'Annaba',v:30,w:12,q:10,pr:120000,dt:toD(10),tm:'09:00',prr:'Urgent',st:'PENDING',si:'Special handling'},
  {e:`${P}m@b.c`,t:'Ceramic tiles',pt:'Construction Materials',pv:'Camion Plateau',o:'Constantine',d:'Guelma',v:18,w:6,q:300,pr:40000,dt:toD(4),tm:'11:00',prr:'Normal',st:'PENDING',si:'Fragile'},
  {e:`${P}am@b.c`,t:'Textile products',pt:'Textile / Clothing',pv:'Camion Rideau',o:'Annaba',d:'Constantine',v:12,w:3,q:500,pr:35000,dt:toD(3),tm:'08:30',prr:'Normal',st:'PENDING',si:null},
  {e:`${P}am@b.c`,t:'Seafood shipment',pt:'Perishables / Food',pv:'Refrigerated Truck',o:'Annaba',d:'Setif',v:10,w:4,q:200,pr:60000,dt:toD(1),tm:'04:00',prr:'Urgent',st:'PENDING',si:'Keep at -20C'},
  {e:`${P}am@b.c`,t:'Pharmaceutical',pt:'Pharmaceutical',pv:'Refrigerated Truck',o:'Annaba',d:'Algiers',v:8,w:1.5,q:100,pr:80000,dt:toD(2),tm:'06:00',prr:'Urgent',st:'PENDING',si:'Temp: 2-8C'},
  {e:`${P}am@b.c`,t:'Furniture set',pt:'Furniture',pv:'Camion Benne',o:'Annaba',d:'Jijel',v:15,w:2,q:30,pr:28000,dt:toD(5),tm:'09:00',prr:'Normal',st:'PENDING',si:'Assembly needed'},
  {e:`${P}am@b.c`,t:'Chemical products',pt:'Chemical',pv:'Camion Citerne',o:'Annaba',d:'Skikda',v:20,w:15,q:5,pr:95000,dt:toD(6),tm:'07:00',prr:'High',st:'PENDING',si:'Hazardous'},
  {e:`${P}am@b.c`,t:'Agricultural products',pt:'Agricultural',pv:'Camion Plateau',o:'Annaba',d:'El Tarf',v:25,w:8,q:150,pr:32000,dt:toD(4),tm:'10:00',prr:'Normal',st:'PENDING',si:null},
  {e:`${P}am@b.c`,t:'Auto parts',pt:'Automotive',pv:'Camion Rideau',o:'Annaba',d:'Tebessa',v:14,w:4.5,q:80,pr:42000,dt:toD(8),tm:'08:00',prr:'High',st:'PENDING',si:null},
  {e:`${P}at@b.c`,t:'International cargo',pt:'Industrial / Bulk',pv:'Semi-trailer',o:'Algiers',d:'Oran',v:35,w:18,q:500,pr:150000,dt:toD(5),tm:'06:00',prr:'Normal',st:'PENDING',si:'Port to port'},
  {e:`${P}at@b.c`,t:'Machinery parts',pt:'Industrial / Bulk',pv:'Semi-trailer',o:'Oran',d:'Constantine',v:28,w:14,q:200,pr:120000,dt:toD(6),tm:'07:30',prr:'High',st:'PENDING',si:'Heavy lifting'},
  {e:`${P}at@b.c`,t:'Electronics containers',pt:'Electronics',pv:'Semi-trailer',o:'Annaba',d:'Algiers',v:40,w:20,q:1000,pr:200000,dt:toD(4),tm:'05:00',prr:'Urgent',st:'PENDING',si:'High value'},
  {e:`${P}at@b.c`,t:'Paper products',pt:'Paper / Packaging',pv:'Semi-trailer',o:'Constantine',d:'Oran',v:32,w:16,q:400,pr:85000,dt:toD(7),tm:'08:00',prr:'Normal',st:'PENDING',si:null},
  {e:`${P}at@b.c`,t:'Plastic materials',pt:'Chemical',pv:'Semi-trailer',o:'Algiers',d:'Setif',v:30,w:15,q:300,pr:95000,dt:toD(3),tm:'09:00',prr:'Normal',st:'PENDING',si:null},
  {e:`${P}at@b.c`,t:'Steel coils',pt:'Industrial / Bulk',pv:'Semi-trailer',o:'Oran',d:'Annaba',v:25,w:22,q:50,pr:180000,dt:toD(8),tm:'07:00',prr:'High',st:'PENDING',si:'Very heavy'},
  {e:`${P}at@b.c`,t:'Food products',pt:'Food',pv:'Semi-trailer',o:'Constantine',d:'Algiers',v:38,w:19,q:600,pr:110000,dt:toD(2),tm:'06:30',prr:'Normal',st:'PENDING',si:null},
  {e:`${P}at@b.c`,t:'Glass products',pt:'Construction Materials',pv:'Semi-trailer',o:'Setif',d:'Oran',v:22,w:12,q:100,pr:75000,dt:toD(5),tm:'08:30',prr:'High',st:'PENDING',si:'Extremely fragile'},
  {e:`${P}at@b.c`,t:'Textile export',pt:'Textile / Clothing',pv:'Semi-trailer',o:'Algiers',d:'Constantine',v:26,w:13,q:800,pr:90000,dt:toD(6),tm:'07:00',prr:'Normal',st:'PENDING',si:null},
  {e:`${P}at@b.c`,t:'Mining equipment',pt:'Industrial / Bulk',pv:'Semi-trailer',o:'Annaba',d:'Oran',v:45,w:25,q:20,pr:250000,dt:toD(10),tm:'05:30',prr:'Urgent',st:'PENDING',si:'Oversized'},
];

const routes = [
  {e:`${P}a@b.c`,vp:'90001-001-16',n:'Algiers to Blida',o:'Algiers',d:'Blida',wp:['Birkhadem'],r:null,dt:toD(2),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:'Morning'},
  {e:`${P}a@b.c`,vp:'90001-001-16',n:'Algiers to Tipaza',o:'Algiers',d:'Tipaza',wp:['Cheraga'],r:null,dt:toD(3),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:'Afternoon'},
  // Karim route search and reverse trip for the presentation demo.
  {e:`${P}k@b.c`,vp:'90001-001-16',n:'Karim Eastbound Corridor',o:'Oran',d:'Constantine',wp:['Mostaganem','Chlef','Tipaza','Blida','Algiers'],r:'Northern Corridor',dt:toD(1),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:'Matches the west-to-east road demo'},
  {e:`${P}k@b.c`,vp:'90001-001-16',n:'Karim Return Corridor',o:'Constantine',d:'Oran',wp:['Skikda','Jijel','Algiers','Blida','Tipaza','Chlef','Mostaganem'],r:'Northern Corridor',dt:toD(2),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:'Return trip with the same road stops'},
  {e:`${P}k@b.c`,vp:'90001-001-16',n:'Karim Regional Stopover',o:'Oran',d:'Skikda',wp:['Mostaganem','Chlef','Algiers'],r:'West-East Link',dt:null,pt:'REGION',dtp:'INTERVAL',is:toD(1),ie:toD(8),st:'IN_PROGRESS',mi:'Useful for region filtering in the demo'},
  {e:`${P}f@b.c`,vp:'90003-003-16',n:'Oran to Mostaganem',o:'Oran',d:'Mostaganem',wp:['Arzew'],r:null,dt:toD(1),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:'Refrigerated'},
  {e:`${P}f@b.c`,vp:'90003-003-16',n:'Oran to Chlef',o:'Oran',d:'Chlef',wp:['Relizane'],r:null,dt:toD(2),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
  {e:`${P}f@b.c`,vp:'90003-003-16',n:'Oran to Tlemcen',o:'Oran',d:'Tlemcen',wp:['Sidi Bel Abbes','Maghnia'],r:null,dt:toD(4),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
  {e:`${P}f@b.c`,vp:'90003-003-16',n:'Oran to Sidi Bel Abbes',o:'Oran',d:'Sidi Bel Abbes',wp:[],r:null,dt:toD(3),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
  {e:`${P}m@b.c`,vp:'90002-002-16',n:'Constantine to Batna',o:'Constantine',d:'Batna',wp:['Mila','Ain Beida'],r:null,dt:toD(5),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
  {e:`${P}m@b.c`,vp:'90002-002-16',n:'Constantine to Skikda',o:'Constantine',d:'Skikda',wp:['Jijel'],r:null,dt:toD(7),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
  {e:`${P}m@b.c`,vp:'90002-002-16',n:'Constantine to Oum El Bouaghi',o:'Constantine',d:'Oum El Bouaghi',wp:['Ain Mlila'],r:null,dt:toD(3),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
  {e:`${P}am@b.c`,vp:'90004-004-16',n:'Annaba to Constantine',o:'Annaba',d:'Constantine',wp:['Skikda','Guelma'],r:null,dt:toD(3),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
  {e:`${P}am@b.c`,vp:'90004-004-16',n:'Annaba to Setif',o:'Annaba',d:'Setif',wp:['Constantine','Mila'],r:null,dt:toD(1),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:'Early morning'},
  {e:`${P}am@b.c`,vp:'90004-004-16',n:'Annaba to Algiers',o:'Annaba',d:'Algiers',wp:['Constantine','Setif'],r:null,dt:toD(2),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
  {e:`${P}am@b.c`,vp:'90004-004-16',n:'Annaba to Jijel',o:'Annaba',d:'Jijel',wp:['Skikda'],r:null,dt:toD(5),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
  {e:`${P}am@b.c`,vp:'90004-004-16',n:'Annaba to El Tarf',o:'Annaba',d:'El Tarf',wp:[],r:null,dt:toD(4),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
  {e:`${P}at@b.c`,vp:'90005-005-16',n:'Algiers to Oran',o:'Algiers',d:'Oran',wp:['Chlef','Relizane'],r:null,dt:toD(5),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:'Long-haul'},
  {e:`${P}at@b.c`,vp:'90005-005-16',n:'Oran to Constantine',o:'Oran',d:'Constantine',wp:['Tiaret','Djelfa','Mila'],r:null,dt:toD(6),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
  {e:`${P}at@b.c`,vp:'90005-005-16',n:'Annaba to Algiers',o:'Annaba',d:'Algiers',wp:['Constantine','Setif'],r:null,dt:toD(4),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
  {e:`${P}at@b.c`,vp:'90005-005-16',n:'Constantine to Oran',o:'Constantine',d:'Oran',wp:['Mila','Setif','Tiaret'],r:null,dt:toD(7),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
  {e:`${P}at@b.c`,vp:'90005-005-16',n:'Algiers to Setif',o:'Algiers',d:'Setif',wp:['Bouira'],r:null,dt:toD(3),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
  {e:`${P}at@b.c`,vp:'90005-005-16',n:'Setif to Oran',o:'Setif',d:'Oran',wp:['Tiaret'],r:null,dt:toD(5),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
  {e:`${P}at@b.c`,vp:'90005-005-16',n:'Oran to Annaba',o:'Oran',d:'Annaba',wp:['Mostaganem','Chlef','Skikda'],r:null,dt:toD(8),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
  {e:`${P}at@b.c`,vp:'90005-005-16',n:'East-West Corridor',o:'Annaba',d:'Oran',wp:['Constantine','Setif','Algiers'],r:null,dt:toD(10),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:'Major route'},
  {e:`${P}fa@b.c`,vp:'90006-006-16',n:'Oran West Loop',o:'Oran',d:'Mostaganem',wp:['Arzew'],r:null,dt:toD(2),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
  {e:`${P}fa@b.c`,vp:'90006-006-16',n:'Oran to Chlef',o:'Oran',d:'Chlef',wp:['Relizane'],r:null,dt:toD(3),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
  {e:`${P}fa@b.c`,vp:'90006-006-16',n:'Oran to Tlemcen',o:'Oran',d:'Tlemcen',wp:['Sidi Bel Abbes'],r:null,dt:toD(4),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
  {e:`${P}fa@b.c`,vp:'90006-006-16',n:'West Algeria Regional',o:'Oran',d:'Tlemcen',wp:['Mostaganem','Sidi Bel Abbes'],r:null,dt:null,pt:'REGION',dtp:'INTERVAL',is:toD(2),ie:toD(10),st:'IN_PROGRESS',mi:'Western region'},
  {e:`${P}fa@b.c`,vp:'90006-006-16',n:'Oran to Algiers',o:'Oran',d:'Algiers',wp:['Chlef'],r:null,dt:toD(5),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
  {e:`${P}fa@b.c`,vp:'90006-006-16',n:'Chlef to Algiers',o:'Chlef',d:'Algiers',wp:[],r:null,dt:toD(6),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
];

const subRequests = [
  // Karim has no subscription, wants INDIVIDUAL - PENDING
  {e:`${P}k@b.c`, tier:'INDIVIDUAL', st:'PENDING'},
  // Sara has no subscription, wants BUSINESS - PENDING
  {e:`${P}s@b.c`, tier:'BUSINESS', st:'PENDING'},
];

const contacts = [
  // Karim needs direct access to owners during the demo.
  {ue:`${P}k@b.c`,ce:`${P}at@b.c`},
  {ue:`${P}k@b.c`,ce:`${P}fa@b.c`},
  {ue:`${P}k@b.c`,ce:`${P}no@b.c`},
  {ue:`${P}a@b.c`,ce:`${P}m@b.c`},{ue:`${P}a@b.c`,ce:`${P}at@b.c`},{ue:`${P}f@b.c`,ce:`${P}am@b.c`},{ue:`${P}f@b.c`,ce:`${P}fa@b.c`},
  {ue:`${P}m@b.c`,ce:`${P}a@b.c`},{ue:`${P}m@b.c`,ce:`${P}f@b.c`},{ue:`${P}m@b.c`,ce:`${P}am@b.c`},{ue:`${P}m@b.c`,ce:`${P}k@b.c`},
  {ue:`${P}m@b.c`,ce:`${P}s@b.c`},{ue:`${P}m@b.c`,ce:`${P}at@b.c`},{ue:`${P}m@b.c`,ce:`${P}fa@b.c`},{ue:`${P}m@b.c`,ce:`${P}no@b.c`},
  {ue:`${P}am@b.c`,ce:`${P}f@b.c`},{ue:`${P}am@b.c`,ce:`${P}m@b.c`},{ue:`${P}am@b.c`,ce:`${P}k@b.c`},{ue:`${P}am@b.c`,ce:`${P}s@b.c`},
  {ue:`${P}at@b.c`,ce:`${P}m@b.c`},{ue:`${P}at@b.c`,ce:`${P}am@b.c`},{ue:`${P}at@b.c`,ce:`${P}fa@b.c`},{ue:`${P}at@b.c`,ce:`${P}no@b.c`},
  {ue:`${P}fa@b.c`,ce:`${P}f@b.c`},{ue:`${P}fa@b.c`,ce:`${P}at@b.c`},{ue:`${P}fa@b.c`,ce:`${P}no@b.c`},{ue:`${P}no@b.c`,ce:`${P}am@b.c`},
  {ue:`${P}no@b.c`,ce:`${P}at@b.c`},{ue:`${P}no@b.c`,ce:`${P}fa@b.c`},
];

const messages = [
  // Karim asks for eastbound shipments and receives follow-up replies.
  {f:`${P}k@b.c`,t:`${P}at@b.c`,msg:'I am going from Oran to Constantine via Mostaganem, Chlef, Tipaza, Blida and Algiers. Do you have loads on this corridor?',img:null},
  {f:`${P}at@b.c`,t:`${P}k@b.c`,msg:'Yes, I have cargo from Oran to Constantine and a return load from Constantine to Oran.',img:null},
  {f:`${P}k@b.c`,t:`${P}fa@b.c`,msg:'I also want to fill the road back from Blida to Mostaganem and Oran. Anything available?',img:null},
  {f:`${P}fa@b.c`,t:`${P}k@b.c`,msg:'We have refrigerated and general cargo from Algiers to Jijel and Oran to Mostaganem.',img:null},
  {f:`${P}a@b.c`,t:`${P}m@b.c`,msg:'Hello, I have a shipment from Algiers to Blida',img:null},
  {f:`${P}m@b.c`,t:`${P}a@b.c`,msg:'I can help, my vehicle is available',img:null},
  {f:`${P}a@b.c`,t:`${P}m@b.c`,msg:'Great, what is your price?',img:null},
  {f:`${P}m@b.c`,t:`${P}a@b.c`,msg:'15000 DZD',img:null},
  {f:`${P}f@b.c`,t:`${P}am@b.c`,msg:'I need refrigerated transport to Setif',img:null},
  {f:`${P}am@b.c`,t:`${P}f@b.c`,msg:'I have a route available tomorrow',img:null},
  {f:`${P}at@b.c`,t:`${P}m@b.c`,msg:'We have a long-haul route from Constantine to Oran',img:null},
  {f:`${P}m@b.c`,t:`${P}at@b.c`,msg:'Perfect, I have industrial equipment',img:null},
  {f:`${P}fa@b.c`,t:`${P}at@b.c`,msg:'Collaboration opportunity?',img:null},
  {f:`${P}at@b.c`,t:`${P}fa@b.c`,msg:'Yes, we can share routes',img:null},
];

async function main() {
  console.log('🧹 Cleaning old demo seed data...');
  await prisma.message.deleteMany({ where: { from: { email: { startsWith: P } } } });
  await prisma.contact.deleteMany({ where: { userRel: { email: { startsWith: P } } } });
  await prisma.route.deleteMany({ where: { user: { email: { startsWith: P } } } });
  await prisma.shipment.deleteMany({ where: { user: { email: { startsWith: P } } } });
  await prisma.vehicle.deleteMany({ where: { user: { email: { startsWith: P } } } });
  await prisma.subscription.deleteMany({ where: { user: { email: { startsWith: P } } } });
  await prisma.subscriptionRequest.deleteMany({ where: { user: { email: { startsWith: P } } } });
  await prisma.individual.deleteMany({ where: { user: { email: { startsWith: P } } } });
  await prisma.business.deleteMany({ where: { user: { email: { startsWith: P } } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: P } } });
  console.log('👥 Creating users, profiles, and subscriptions...');
  const userMap = {};
  for (const u of users) {
    const hashed = await bcrypt.hash(DP, 10);
    const user = await prisma.user.create({
      data: { email: u.e, password: hashed, phone: u.ph, type: u.t, role: u.r, status: u.s, isVerified: true }
    });
    if (u.pr.k === 'individual') {
      await prisma.individual.create({ data: { user_ID: user.id, full_Name: u.pr.fn, nin: u.pr.ni, location: u.pr.lo } });
    } else {
      await prisma.business.create({ data: { user_ID: user.id, business_Name: u.pr.bn, rc_Number: u.pr.rc, form: u.pr.fo, nif: u.pr.nf, nis: u.pr.ns, locations: u.pr.ls } });
    }
    if (u.tr) {
      await prisma.subscription.create({ data: { user_ID: user.id, tier: u.tr, shipmentsThisMonth: u.sc, routesThisMonth: u.rc, contactsCount: u.cc } });
    }
    userMap[u.e] = user.id;
  }
  console.log('🚗 Creating vehicles...');
  for (const v of vehicles) {
    await prisma.vehicle.create({
      data: { plate_Number: v.pl, vehicle_Name: v.n, type: v.ty, color: v.cl, year: v.yr, capacity: v.cp, photo: v.ph, status: v.st, user_ID: userMap[v.em] }
    });
  }
  console.log('📦 Creating shipments...');
  for (const s of shipments) {
    await prisma.shipment.create({
      data: { title: s.t, product_Type: s.pt, possible_Veh: s.pv, origin: s.o, destination: s.d, volume: s.v, weight: s.w, quantity: s.q, price: s.pr, date: s.dt, time: s.tm, priority: s.prr, special_Information: s.si, status: s.st, user_ID: userMap[s.e] }
    });
  }
  console.log('🛣️  Creating routes...');
  for (const r of routes) {
    await prisma.route.create({
      data: { name: r.n, origin: r.o, destination: r.d, waypoints: r.wp, region: r.r, date: r.dt, post_type: r.pt, date_type: r.dtp, interval_start: r.is, interval_end: r.ie, more_Information: r.mi, status: r.st, user_ID: userMap[r.e], vehicle_plate: r.vp }
    });
  }
  console.log('� Creating subscription requests...');
  for (const sr of subRequests) {
    await prisma.subscriptionRequest.create({
      data: { user_ID: userMap[sr.e], tier: sr.tier, status: sr.st }
    });
  }
  console.log('�� Creating contacts...');
  for (const c of contacts) {
    await prisma.contact.create({ data: { user: userMap[c.ue], contactOf: userMap[c.ce] } });
  }
  console.log('💬 Creating messages...');
  for (const m of messages) {
    await prisma.message.create({ data: { fromUser: userMap[m.f], toUser: userMap[m.t], msg: m.msg, image: m.img } });
  }
  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('=== TEST SCENARIOS ===');
  console.log('FILTER POSSIBILITIES:');
  console.log('- By Origin: Algiers, Oran, Mostaganem, Mascara, Chlef, Tipaza, Blida, Constantine, Skikda, Jijel');
  console.log('- By Destination: Blida, Boumerdes, Tipaza, Mostaganem, Chlef, Algiers, Constantine, Jijel, Skikda, Oran');
  console.log('- By Date: Today, Tomorrow, Next 3-10 days');
  console.log('- By Price: 8,000 - 250,000 DZD');
  console.log('- By Weight: 0.2 - 25 t');
  console.log('- By Volume: 3 - 45 m³');
  console.log('- By Product Type: Furniture, Electronics, Food, Construction, Industrial, Chemical, Pharmaceutical, Textile, Automotive, Agricultural');
  console.log('- By Priority: Normal, High, Urgent');
  console.log('');
  console.log('SUGGESTING/MATCHING POSSIBILITIES:');
  console.log('- Direct matches: Oran→Constantine, Mostaganem→Jijel, Mascara→Skikda, Blida→Skikda');
  console.log('- Multi-waypoint: Oran→Constantine (via Mostaganem, Chlef, Tipaza, Blida, Algiers), Constantine→Oran (return road)');
  console.log('- Regional routes: Karim Regional Stopover (interval), West Algeria Regional (interval)');
  console.log('- Long-haul: East-West Corridor, Karim corridor with road-based shipments and return loads');
  console.log('');
  console.log('SUBSCRIPTION LIMITATION SCENARIOS:');
  console.log('- FREE Tier: Ahmed (3/4 shipments, 2/4 routes, 1/2 contacts - has room), Fatima (4/4 shipments, 4/4 routes, 2/2 contacts - at limit)');
  console.log('- INDIVIDUAL Tier: Mohamed (5/100 shipments, 3/100 routes, 8/15 contacts), Amina (7/100 shipments, 5/100 routes, 14/15 contacts - near contact limit)');
  console.log('- BUSINESS Tier: Unlimited (Atlas Logistics, Fast Transport, Nord Fret)');
  console.log('');
  console.log('SUBSCRIPTION REQUEST SCENARIOS:');
  console.log('- Karim Hadjadji: No subscription, PENDING request for INDIVIDUAL');
  console.log('- Sara Merad: No subscription, PENDING request for BUSINESS');
  console.log('- Admin can accept/reject these requests in the Subscriptions panel');
  console.log('- Admin can refresh any existing subscription (reset dates + counters)');
  console.log('- Karim demo flow: filter by origins, destinations, road stops, date, and price without hitting an empty result set');
  console.log('');
  console.log('OTHER TEST POSSIBILITIES:');
  console.log('- Chat conversations with message history');
  console.log('- My Routes / My Shipments views');
  console.log('- Contact management with tier limits');
  console.log('- Vehicle management');
  console.log('');
  console.log('=== LOGIN CREDENTIALS ===');
  console.log('Password for all accounts:', DP);
  console.log('');
  for (const u of users) {
    console.log(`${u.pr.k === 'individual' ? u.pr.fn : u.pr.bn}: ${u.e} (${u.tr})`);
  }
}
main().catch(e => { console.error('❌ Seed failed:', e); process.exit(1); }).finally(() => prisma.$disconnect());

