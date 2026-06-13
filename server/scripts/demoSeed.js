const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const prisma = require('../config/prismaClient');

const P = '';
const DP = 'Wesselli123456';
const toD = (o) => { const d = new Date(); d.setDate(d.getDate() + o); return d; };

const users = [
  {e:`${P}os_bouanani@esi.dz`,ph:'0555000001',t:'INDIVIDUAL',r:'ADMIN',s:'ACTIVE',photo:'/uploads/Bouanani_Sohaib.jpg',pr:{k:'individual',fn:'Bouanani Sohaib',ni:'100000000000000001',lo:'Medea'},sub:{tier:'BUSINESS',sc:0,rc:0,cc:0}},
  {e:`${P}om_ghebache@esi.dz`,ph:'0555000002',t:'INDIVIDUAL',r:'USER',s:'ACTIVE',photo:'/uploads/Ghebache_Mehdi.jpg',pr:{k:'individual',fn:'Ghebache Mehdi',ni:'100000000000000002',lo:'Algiers'},sub:{tier:'FREE',sc:0,rc:0,cc:0}},
  {e:`${P}oi_allek@esi.dz`,ph:'0555000003',t:'INDIVIDUAL',r:'USER',s:'ACTIVE',photo:'/uploads/Allek_Ilyes.jpg',pr:{k:'individual',fn:'Allek Ilyes',ni:'100000000000000003',lo:'Tizi Ouzou'},sub:{tier:'FREE',sc:3,rc:3,cc:1}},
  {e:`${P}or_boudjenouia@esi.dz`,ph:'0555000004',t:'INDIVIDUAL',r:'USER',s:'ACTIVE',photo:'/uploads/Boudjenouia_Ramzi.jpg',pr:{k:'individual',fn:'Boudjenouia Ramzi',ni:'100000000000000004',lo:'Setif'},sub:{tier:'INDIVIDUAL',sc:5,rc:3,cc:8}},
  {e:`${P}oy_keddam@esi.dz`,ph:'0555000006',t:'INDIVIDUAL',r:'USER',s:'ACTIVE',photo:'/uploads/Keddam_Youcef.jpg',pr:{k:'individual',fn:'Keddam Youcef',ni:'100000000000000006',lo:'Jijel'},sub:{tier:'FREE',sc:2,rc:2,cc:1}},
  {e:`${P}Cevitale@business.dz`,ph:'0215500001',t:'BUSINESS',r:'USER',s:'ACTIVE',photo:'/uploads/Cevital.jpg',pr:{k:'business',bn:'Cevital Group',rc:'16999A99',fo:'SPA',nf:'000111222333444',ns:'000111222333444',ls:['Algiers','Bejaia','Setif']},sub:{tier:'BUSINESS',sc:15,rc:12,cc:25}},
  {e:`${P}Condor@business.dz`,ph:'0215500002',t:'BUSINESS',r:'USER',s:'ACTIVE',photo:'/uploads/Condor.jpg',pr:{k:'business',bn:'Condor Electronics',rc:'16988B88',fo:'SARL',nf:'000555666777888',ns:'000555666777888',ls:['Bordj Bou Arreridj','Algiers']},sub:{tier:'BUSINESS',sc:10,rc:8,cc:20}},
  {e:`${P}Cosider@business.dz`,ph:'0215500003',t:'BUSINESS',r:'USER',s:'ACTIVE',photo:'/uploads/Cosider.jpg',pr:{k:'business',bn:'Cosider Group',rc:'16977C77',fo:'SPA',nf:'000999888777666',ns:'000999888777666',ls:['Algiers']},sub:{tier:'BUSINESS',sc:20,rc:15,cc:30}},
  {e:`${P}Hamoud@business.dz`,ph:'0215500004',t:'BUSINESS',r:'USER',s:'ACTIVE',photo:'/uploads/Hamoud_Boulem.jpg',pr:{k:'business',bn:'Hamoud Boualem',rc:'16966D66',fo:'EURL',nf:'000333444555666',ns:'000333444555666',ls:['Algiers','Oran','Boumerdes']},sub:{tier:'FREE',sc:3,rc:3,cc:1}},
  {e:`${P}Saidal@business.dz`,ph:'0215500005',t:'BUSINESS',r:'USER',s:'ACTIVE',photo:'/uploads/Saidal.jpg',pr:{k:'business',bn:'Saidal',rc:'16955E55',fo:'SARL',nf:'000777888999000',ns:'000777888999000',ls:['Algiers','Constantine','Medea']},sub:{tier:'INDIVIDUAL',sc:10,rc:8,cc:5}},
  {e:`${P}Sonatrach@business.dz`,ph:'0215500006',t:'BUSINESS',r:'USER',s:'ACTIVE',photo:'/uploads/Sonatrach.jpg',pr:{k:'business',bn:'Sonatrach',rc:'16944F44',fo:'SPA',nf:'000222111000999',ns:'000222111000999',ls:['Algiers','Ouargla','Oran']},sub:{tier:'BUSINESS',sc:30,rc:25,cc:40}},
  {e:`${P}k@b.c`,ph:'0555000010',t:'INDIVIDUAL',r:'USER',s:'ACTIVE',photo:'/uploads/Karim_Hadjadji.jpg',pr:{k:'individual',fn:'Karim Hadjadji',ni:'100000000000000010',lo:'Setif'},sub:{tier:'FREE',sc:0,rc:0,cc:0}},
];

const vehicles = [
  {pl:'16001-001-16',em:`${P}os_bouanani@esi.dz`,n:'Renault Kangoo',ty:'Small Van',cl:'White',yr:2021,cp:0.8,ph:'/uploads/Fourgon.jpg',st:'AVAILABLE'},
  {pl:'16002-002-16',em:`${P}oi_allek@esi.dz`,n:'Peugeot Partner',ty:'Small Van',cl:'Blue',yr:2022,cp:0.6,ph:'/uploads/Car.jpg',st:'AVAILABLE'},
  {pl:'16003-003-16',em:`${P}or_boudjenouia@esi.dz`,n:'Iveco Daily',ty:'Fourgon',cl:'White',yr:2020,cp:7,ph:'/uploads/ClosedBoxVan.jpg',st:'AVAILABLE'},
  {pl:'16004-004-16',em:`${P}or_boudjenouia@esi.dz`,n:'Citroen Berlingo',ty:'Small Van',cl:'Red',yr:2022,cp:1.2,ph:'/uploads/Car.jpg',st:'ACTIVE'},
  {pl:'16007-007-16',em:`${P}om_ghebache@esi.dz`,n:'Dacia Dokker',ty:'Small Van',cl:'Grey',yr:2023,cp:0.5,ph:'/uploads/Car.jpg',st:'AVAILABLE'},
  {pl:'16008-008-16',em:`${P}oy_keddam@esi.dz`,n:'Ford Transit',ty:'Small Van',cl:'White',yr:2021,cp:1.5,ph:'/uploads/Fourgon.jpg',st:'AVAILABLE'},
  {pl:'16009-009-16',em:`${P}Cevitale@business.dz`,n:'Volvo FH16',ty:'Semi-trailer',cl:'Blue',yr:2022,cp:24,ph:'/uploads/ClosedBoxVan.jpg',st:'AVAILABLE'},
  {pl:'16010-010-16',em:`${P}Cevitale@business.dz`,n:'Refrigerated Volvo',ty:'Refrigerated Truck',cl:'White',yr:2023,cp:20,ph:'/uploads/RefrigeratorTruck.jpg',st:'ACTIVE'},
  {pl:'16011-011-16',em:`${P}Condor@business.dz`,n:'Mercedes Actros',ty:'Semi-trailer',cl:'Silver',yr:2023,cp:26,ph:'/uploads/ClosedBoxVan.jpg',st:'AVAILABLE'},
  {pl:'16012-012-16',em:`${P}Condor@business.dz`,n:'Isuzu NPR',ty:'Dropside Truck',cl:'White',yr:2021,cp:4,ph:'/uploads/Fourgon.jpg',st:'AVAILABLE'},
  {pl:'16013-013-16',em:`${P}Condor@business.dz`,n:'Tanker Truck',ty:'Tanker',cl:'White',yr:2020,cp:15,ph:'/uploads/Tanker.jpg',st:'ACTIVE'},
  {pl:'16014-014-16',em:`${P}Cosider@business.dz`,n:'Scania R450',ty:'Semi-trailer',cl:'Orange',yr:2022,cp:22,ph:'/uploads/Flatbed.jpg',st:'AVAILABLE'},
  {pl:'16015-015-16',em:`${P}Cosider@business.dz`,n:'MAN TGS',ty:'Semi-trailer',cl:'Red',yr:2023,cp:28,ph:'/uploads/ClosedBoxVan.jpg',st:'ACTIVE'},
  {pl:'16016-016-16',em:`${P}Hamoud@business.dz`,n:'Hyundai HD78',ty:'Dropside Truck',cl:'White',yr:2021,cp:3.5,ph:'/uploads/Fourgon.jpg',st:'AVAILABLE'},
  {pl:'16017-017-16',em:`${P}Hamoud@business.dz`,n:'Renault Master',ty:'Small Van',cl:'Blue',yr:2022,cp:1.8,ph:'/uploads/Car.jpg',st:'AVAILABLE'},
  {pl:'16018-018-16',em:`${P}Saidal@business.dz`,n:'Medical Transport',ty:'Medical Transport',cl:'White',yr:2022,cp:4,ph:'/uploads/Medical.jpg',st:'AVAILABLE'},
  {pl:'16019-019-16',em:`${P}Saidal@business.dz`,n:'Iveco Eurocargo',ty:'Dropside Truck',cl:'Green',yr:2021,cp:6,ph:'/uploads/ClosedBoxVan.jpg',st:'ACTIVE'},
  {pl:'16020-020-16',em:`${P}Sonatrach@business.dz`,n:'DAF XF',ty:'Semi-trailer',cl:'White',yr:2023,cp:30,ph:'/uploads/Tanker.jpg',st:'AVAILABLE'},
  {pl:'16021-021-16',em:`${P}Sonatrach@business.dz`,n:'Volvo FM',ty:'Semi-trailer',cl:'Blue',yr:2022,cp:25,ph:'/uploads/ClosedBoxVan.jpg',st:'AVAILABLE'},
  {pl:'16022-022-16',em:`${P}Sonatrach@business.dz`,n:'Mercedes Arocs',ty:'Semi-trailer',cl:'White',yr:2023,cp:35,ph:'/uploads/Flatbed.jpg',st:'ACTIVE'},
  {pl:'16023-023-16',em:`${P}k@b.c`,n:'Renault Master',ty:'Small Van',cl:'White',yr:2022,cp:2.5,ph:'/uploads/Fourgon.jpg',st:'AVAILABLE'},
];

const shipments = [
  // Sohaib (2) - Medea
  {e:`${P}os_bouanani@esi.dz`,t:'Office furniture',pt:'Furniture',pv:'Fourgon',o:'Medea',d:'Algiers',v:5,w:0.4,q:15,pr:12000,dt:toD(2),tm:'10:00',prr:'Normal',st:'PENDING',si:'Elevator available'},
  {e:`${P}os_bouanani@esi.dz`,t:'Computer equipment',pt:'Electronics',pv:'Fourgon',o:'Medea',d:'Blida',v:3,w:0.2,q:30,pr:25000,dt:toD(-3),tm:'14:30',prr:'High',st:'DELIVERED',si:'Fragile'},
  // Ilyes (2) - Tizi Ouzou, FREE near limit
  {e:`${P}oi_allek@esi.dz`,t:'Fresh vegetables',pt:'Perishables / Food',pv:'Refrigerated Truck',o:'Tizi Ouzou',d:'Algiers',v:6,w:1.2,q:100,pr:25000,dt:toD(1),tm:'06:00',prr:'Urgent',st:'PENDING',si:'Keep at 4C'},
  {e:`${P}oi_allek@esi.dz`,t:'Dairy products',pt:'Perishables / Food',pv:'Refrigerated Truck',o:'Tizi Ouzou',d:'Boumerdes',v:4,w:0.8,q:80,pr:18000,dt:toD(0),tm:'07:30',prr:'High',st:'IN_TRANSIT',si:'Keep at 2C'},
  // Ramzi (2) - Setif, INDIVIDUAL
  {e:`${P}or_boudjenouia@esi.dz`,t:'Construction materials',pt:'Construction Materials',pv:'Camion Benne',o:'Setif',d:'Constantine',v:15,w:5,q:200,pr:45000,dt:toD(5),tm:'08:00',prr:'Normal',st:'PENDING',si:'Unloading on site'},
  {e:`${P}or_boudjenouia@esi.dz`,t:'Steel beams',pt:'Construction Materials',pv:'Semi-trailer',o:'Setif',d:'Bordj Bou Arreridj',v:25,w:8,q:50,pr:75000,dt:toD(-5),tm:'10:00',prr:'High',st:'DELIVERED',si:'Crane needed'},
  // Mehdi (2) - Algiers, FREE pending request
  {e:`${P}om_ghebache@esi.dz`,t:'Electronics parts',pt:'Electronics',pv:'Fourgon',o:'Algiers',d:'Setif',v:4,w:0.3,q:50,pr:35000,dt:toD(3),tm:'09:00',prr:'Normal',st:'PENDING',si:'Anti-static packaging'},
  {e:`${P}om_ghebache@esi.dz`,t:'Agricultural supplies',pt:'Agricultural',pv:'Camion Plateau',o:'Algiers',d:'Bejaia',v:12,w:3,q:150,pr:22000,dt:toD(-2),tm:'11:00',prr:'Normal',st:'CANCELLED',si:null},
  // Youcef (2) - Jijel, FREE pending request
  {e:`${P}oy_keddam@esi.dz`,t:'Home furniture',pt:'Furniture',pv:'Fourgon',o:'Jijel',d:'Constantine',v:6,w:0.5,q:20,pr:15000,dt:toD(2),tm:'10:00',prr:'Normal',st:'PENDING',si:'Disassembly required'},
  {e:`${P}oy_keddam@esi.dz`,t:'Bakery products',pt:'Food',pv:'Fourgon',o:'Jijel',d:'Skikda',v:3,w:0.2,q:40,pr:8000,dt:toD(-4),tm:'08:00',prr:'Normal',st:'DELIVERED',si:null},
  // Cevital (2) - BUSINESS
  {e:`${P}Cevitale@business.dz`,t:'Frozen food',pt:'Perishables / Food',pv:'Refrigerated Truck',o:'Algiers',d:'Setif',v:20,w:8,q:500,pr:120000,dt:toD(0),tm:'05:00',prr:'High',st:'IN_TRANSIT',si:'Keep at -18C'},
  {e:`${P}Cevitale@business.dz`,t:'Olive oil bulk',pt:'Food',pv:'Camion Citerne',o:'Bejaia',d:'Algiers',v:25,w:15,q:50,pr:95000,dt:toD(4),tm:'07:00',prr:'Normal',st:'PENDING',si:'Food grade tank'},
  // Condor (2) - BUSINESS
  {e:`${P}Condor@business.dz`,t:'Electronics appliances',pt:'Electronics',pv:'Camion Rideau',o:'Bordj Bou Arreridj',d:'Setif',v:12,w:3,q:200,pr:55000,dt:toD(3),tm:'09:00',prr:'Normal',st:'PENDING',si:'Fragile'},
  {e:`${P}Condor@business.dz`,t:'Auto parts',pt:'Automotive',pv:'Camion Plateau',o:'Algiers',d:'Bejaia',v:10,w:2.5,q:80,pr:42000,dt:toD(-7),tm:'08:00',prr:'Normal',st:'DELIVERED',si:null},
  // Cosider (2) - BUSINESS
  {e:`${P}Cosider@business.dz`,t:'Construction equipment',pt:'Construction Materials',pv:'Semi-trailer',o:'Algiers',d:'Blida',v:30,w:12,q:100,pr:150000,dt:toD(5),tm:'06:00',prr:'High',st:'PENDING',si:'Heavy lifting gear'},
  {e:`${P}Cosider@business.dz`,t:'Industrial pipes',pt:'Industrial / Bulk',pv:'Camion Plateau',o:'Algiers',d:'Medea',v:22,w:10,q:300,pr:85000,dt:toD(0),tm:'07:00',prr:'Normal',st:'IN_TRANSIT',si:'Oversized load'},
  // Hamoud Boualem (2) - FREE near limit
  {e:`${P}Hamoud@business.dz`,t:'Beverages',pt:'Food',pv:'Fourgon',o:'Oran',d:'Boumerdes',v:5,w:1.5,q:300,pr:18000,dt:toD(1),tm:'08:00',prr:'Normal',st:'PENDING',si:'Stack carefully'},
  {e:`${P}Hamoud@business.dz`,t:'Snack products',pt:'Food',pv:'Fourgon',o:'Algiers',d:'Oran',v:4,w:0.8,q:200,pr:12000,dt:toD(-1),tm:'09:00',prr:'Normal',st:'CANCELLED',si:null},
  // Saidal (2) - INDIVIDUAL
  {e:`${P}Saidal@business.dz`,t:'Medicines',pt:'Pharmaceutical',pv:'Refrigerated Truck',o:'Constantine',d:'Medea',v:6,w:1,q:500,pr:70000,dt:toD(2),tm:'06:00',prr:'Urgent',st:'PENDING',si:'Temp: 15-25C'},
  {e:`${P}Saidal@business.dz`,t:'Medical supplies',pt:'Pharmaceutical',pv:'Fourgon',o:'Algiers',d:'Constantine',v:4,w:0.6,q:150,pr:45000,dt:toD(0),tm:'07:00',prr:'High',st:'IN_TRANSIT',si:'Sterile packaging'},
  // Sonatrach (2) - BUSINESS
  {e:`${P}Sonatrach@business.dz`,t:'Chemical products',pt:'Chemical',pv:'Camion Citerne',o:'Ouargla',d:'Algiers',v:30,w:20,q:10,pr:200000,dt:toD(0),tm:'05:00',prr:'High',st:'IN_TRANSIT',si:'Hazardous material'},
  {e:`${P}Sonatrach@business.dz`,t:'Drilling equipment',pt:'Industrial / Bulk',pv:'Semi-trailer',o:'Oran',d:'Algiers',v:40,w:25,q:20,pr:350000,dt:toD(7),tm:'04:00',prr:'Urgent',st:'PENDING',si:'Oversized - special permit'},
];

const routes = [
  // Sohaib (2) - Medea
  {e:`${P}os_bouanani@esi.dz`,vp:'16001-001-16',n:'Medea to Algiers',o:'Medea',d:'Algiers',wp:['Berrouaghia'],r:null,dt:toD(2),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:'Morning route'},
  {e:`${P}os_bouanani@esi.dz`,vp:'16001-001-16',n:'Medea to Blida',o:'Medea',d:'Blida',wp:['Berrouaghia'],r:null,dt:toD(-3),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'COMPLETED',mi:null},
  // Ilyes (2) - Tizi Ouzou, FREE near limit
  {e:`${P}oi_allek@esi.dz`,vp:'16002-002-16',n:'Tizi Ouzou to Boumerdes',o:'Tizi Ouzou',d:'Boumerdes',wp:['Dra Ben Khedda'],r:null,dt:toD(1),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:'Refrigerated'},
  {e:`${P}oi_allek@esi.dz`,vp:'16002-002-16',n:'Tizi Ouzou to Algiers',o:'Tizi Ouzou',d:'Algiers',wp:['Dra Ben Khedda','Boumerdes'],r:null,dt:toD(0),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'IN_PROGRESS',mi:null},
  // Ramzi (2) - Setif, INDIVIDUAL
  {e:`${P}or_boudjenouia@esi.dz`,vp:'16003-003-16',n:'Setif to Constantine',o:'Setif',d:'Constantine',wp:['Ain Mlila'],r:null,dt:toD(5),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
  {e:`${P}or_boudjenouia@esi.dz`,vp:'16004-004-16',n:'Setif to Bordj Bou Arreridj',o:'Setif',d:'Bordj Bou Arreridj',wp:[],r:null,dt:toD(-5),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'COMPLETED',mi:null},
  // Youcef (2) - Jijel, FREE pending request
  {e:`${P}oy_keddam@esi.dz`,vp:'16008-008-16',n:'Jijel to Constantine',o:'Jijel',d:'Constantine',wp:['Skikda'],r:null,dt:toD(2),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
  {e:`${P}oy_keddam@esi.dz`,vp:'16008-008-16',n:'Jijel to Skikda',o:'Jijel',d:'Skikda',wp:[],r:null,dt:toD(-4),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'COMPLETED',mi:null},
  // Cevital (2) - BUSINESS
  {e:`${P}Cevitale@business.dz`,vp:'16009-009-16',n:'Algiers to Setif',o:'Algiers',d:'Setif',wp:['Bouira'],r:null,dt:toD(1),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
  {e:`${P}Cevitale@business.dz`,vp:'16010-010-16',n:'Bejaia to Algiers',o:'Bejaia',d:'Algiers',wp:['Tizi Ouzou','Boumerdes'],r:null,dt:toD(0),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'IN_PROGRESS',mi:'Long-haul'},
  // Condor (2) - BUSINESS
  {e:`${P}Condor@business.dz`,vp:'16011-011-16',n:'Bordj Bou Arreridj to Setif',o:'Bordj Bou Arreridj',d:'Setif',wp:[],r:null,dt:toD(3),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
  {e:`${P}Condor@business.dz`,vp:'16012-012-16',n:'Algiers to Bejaia',o:'Algiers',d:'Bejaia',wp:['Bouira','Tizi Ouzou'],r:null,dt:toD(-7),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'COMPLETED',mi:null},
  // Cosider (2) - BUSINESS
  {e:`${P}Cosider@business.dz`,vp:'16014-014-16',n:'Algiers to Blida',o:'Algiers',d:'Blida',wp:['Birkhadem'],r:null,dt:toD(5),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
  {e:`${P}Cosider@business.dz`,vp:'16015-015-16',n:'Algiers to Medea',o:'Algiers',d:'Medea',wp:['Blida'],r:null,dt:toD(0),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'IN_PROGRESS',mi:null},
  // Hamoud Boualem (2) - FREE near limit
  {e:`${P}Hamoud@business.dz`,vp:'16016-016-16',n:'Oran to Boumerdes',o:'Oran',d:'Boumerdes',wp:['Mostaganem','Chlef'],r:null,dt:toD(1),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:null},
  {e:`${P}Hamoud@business.dz`,vp:'16017-017-16',n:'Algiers to Oran',o:'Algiers',d:'Oran',wp:['Chlef'],r:null,dt:toD(-1),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'CANCELLED',mi:null},
  // Saidal (2) - INDIVIDUAL
  {e:`${P}Saidal@business.dz`,vp:'16018-018-16',n:'Constantine to Medea',o:'Constantine',d:'Medea',wp:['Setif','Bouira'],r:null,dt:toD(2),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:'Pharma route'},
  {e:`${P}Saidal@business.dz`,vp:'16019-019-16',n:'Algiers to Constantine',o:'Algiers',d:'Constantine',wp:['Setif'],r:null,dt:toD(0),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'IN_PROGRESS',mi:null},
  // Sonatrach (2) - BUSINESS
  {e:`${P}Sonatrach@business.dz`,vp:'16020-020-16',n:'Ouargla to Algiers',o:'Ouargla',d:'Algiers',wp:['Djelfa','M\'sila'],r:null,dt:toD(0),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'SCHEDULED',mi:'South-North route'},
  {e:`${P}Sonatrach@business.dz`,vp:'16021-021-16',n:'Oran to Algiers',o:'Oran',d:'Algiers',wp:['Chlef','Blida'],r:null,dt:toD(0),pt:'ORIGIN_DESTINATION',dtp:'DAY',is:null,ie:null,st:'IN_PROGRESS',mi:'Major corridor'},
];

const subRequests = [
  {e:`${P}om_ghebache@esi.dz`, tier:'INDIVIDUAL', st:'PENDING', att:'/uploads/subscription_request_1.pdf?name=subscription_request_1.pdf'},
  {e:`${P}oy_keddam@esi.dz`, tier:'BUSINESS', st:'PENDING', att:'/uploads/subscription_request_2.png?name=subscription_request_2.png'},
];

const contacts = [
  // Ilyes (1/2 contacts - near limit)
  {ue:`${P}oi_allek@esi.dz`,ce:`${P}or_boudjenouia@esi.dz`},
  // Ramzi (8/15 contacts)
  {ue:`${P}or_boudjenouia@esi.dz`,ce:`${P}os_bouanani@esi.dz`},{ue:`${P}or_boudjenouia@esi.dz`,ce:`${P}oi_allek@esi.dz`},
  {ue:`${P}or_boudjenouia@esi.dz`,ce:`${P}om_ghebache@esi.dz`},{ue:`${P}or_boudjenouia@esi.dz`,ce:`${P}oy_keddam@esi.dz`},{ue:`${P}or_boudjenouia@esi.dz`,ce:`${P}Cevitale@business.dz`},
  {ue:`${P}or_boudjenouia@esi.dz`,ce:`${P}Condor@business.dz`},{ue:`${P}or_boudjenouia@esi.dz`,ce:`${P}Cosider@business.dz`},
  // Sohaib
  {ue:`${P}os_bouanani@esi.dz`,ce:`${P}Cevitale@business.dz`},{ue:`${P}os_bouanani@esi.dz`,ce:`${P}Cosider@business.dz`},{ue:`${P}os_bouanani@esi.dz`,ce:`${P}Sonatrach@business.dz`},
  // Youcef
  {ue:`${P}oy_keddam@esi.dz`,ce:`${P}os_bouanani@esi.dz`},
  // Hamoud (1/2 contacts - near limit)
  {ue:`${P}Hamoud@business.dz`,ce:`${P}os_bouanani@esi.dz`},
  // Saidal (5/15 contacts)
  {ue:`${P}Saidal@business.dz`,ce:`${P}Cosider@business.dz`},{ue:`${P}Saidal@business.dz`,ce:`${P}Cevitale@business.dz`},
  {ue:`${P}Saidal@business.dz`,ce:`${P}or_boudjenouia@esi.dz`},{ue:`${P}Saidal@business.dz`,ce:`${P}Sonatrach@business.dz`},
  // Cevital
  {ue:`${P}Cevitale@business.dz`,ce:`${P}Cosider@business.dz`},{ue:`${P}Cevitale@business.dz`,ce:`${P}Sonatrach@business.dz`},
  // Condor
  {ue:`${P}Condor@business.dz`,ce:`${P}Cosider@business.dz`},
  // Cosider
  {ue:`${P}Cosider@business.dz`,ce:`${P}Sonatrach@business.dz`},
];

const messages = [
  // Ilyes ↔ Ramzi (many messages with attachments - Ilyes near limit)
  {f:`${P}oi_allek@esi.dz`,t:`${P}or_boudjenouia@esi.dz`,msg:'Hello, I have a shipment from Tizi Ouzou to Algiers that needs refrigerated transport',img:null},
  {f:`${P}or_boudjenouia@esi.dz`,t:`${P}oi_allek@esi.dz`,msg:'I can help, what is the temperature requirement?',img:null},
  {f:`${P}oi_allek@esi.dz`,t:`${P}or_boudjenouia@esi.dz`,msg:'It needs to stay at 4C, here is a photo of the cargo',img:'/uploads/chat_attachment_1.jpg?name=chat_attachment_1.jpg'},
  {f:`${P}or_boudjenouia@esi.dz`,t:`${P}oi_allek@esi.dz`,msg:'My vehicle can handle that. What is the weight?',img:null},
  {f:`${P}oi_allek@esi.dz`,t:`${P}or_boudjenouia@esi.dz`,msg:'About 1.2 t, 100 boxes of fresh vegetables',img:null},
  {f:`${P}or_boudjenouia@esi.dz`,t:`${P}oi_allek@esi.dz`,msg:'I can do it for 25000 DZD',img:null},
  {f:`${P}oi_allek@esi.dz`,t:`${P}or_boudjenouia@esi.dz`,msg:'That works, here is the shipment document',img:'/uploads/chat_attachment_2.pdf?name=chat_attachment_2.pdf'},
  {f:`${P}or_boudjenouia@esi.dz`,t:`${P}oi_allek@esi.dz`,msg:'Got it, I will be in Tizi Ouzou tomorrow morning',img:null},
  {f:`${P}oi_allek@esi.dz`,t:`${P}or_boudjenouia@esi.dz`,msg:'Perfect, I also have dairy going to Boumerdes if you are interested',img:null},
  {f:`${P}or_boudjenouia@esi.dz`,t:`${P}oi_allek@esi.dz`,msg:'I might be able to do both, let me check my schedule',img:null},
  // Sohaib ↔ Cevital
  {f:`${P}os_bouanani@esi.dz`,t:`${P}Cevitale@business.dz`,msg:'We need to coordinate the Medea-Algiers route',img:null},
  {f:`${P}Cevitale@business.dz`,t:`${P}os_bouanani@esi.dz`,msg:'Sure, our fleet is available this week',img:null},
  // Cosider ↔ Sonatrach
  {f:`${P}Cosider@business.dz`,t:`${P}Sonatrach@business.dz`,msg:'We have construction equipment for your Ouargla site',img:null},
  {f:`${P}Sonatrach@business.dz`,t:`${P}Cosider@business.dz`,msg:'Great, we need heavy lifting gear at the site',img:null},
  // Youcef ↔ Sohaib
  {f:`${P}oy_keddam@esi.dz`,t:`${P}os_bouanani@esi.dz`,msg:'I have furniture going from Jijel to Constantine, can you help?',img:null},
  {f:`${P}os_bouanani@esi.dz`,t:`${P}oy_keddam@esi.dz`,msg:'I have a route going that way tomorrow',img:null},
  // Hamoud ↔ Sohaib
  {f:`${P}Hamoud@business.dz`,t:`${P}os_bouanani@esi.dz`,msg:'We need to ship beverages from Oran to Boumerdes urgently',img:null},
  {f:`${P}os_bouanani@esi.dz`,t:`${P}Hamoud@business.dz`,msg:'I can pick that up on my route',img:null},
];

async function main() {
  console.log('Cleaning old demo seed data...');
  const seedEmails = users.map(u => u.e);
  const emailFilter = { email: { in: seedEmails } };
  await prisma.message.deleteMany({ where: { from: emailFilter } });
  await prisma.message.deleteMany({ where: { to: emailFilter } });
  await prisma.contact.deleteMany({ where: { userRel: emailFilter } });
  await prisma.contact.deleteMany({ where: { contactRel: emailFilter } });
  await prisma.notification.deleteMany({ where: { user: emailFilter } });
  await prisma.notificationSettings.deleteMany({ where: { user: emailFilter } });
  await prisma.route.deleteMany({ where: { user: emailFilter } });
  await prisma.shipment.deleteMany({ where: { user: emailFilter } });
  await prisma.vehicle.deleteMany({ where: { user: emailFilter } });
  await prisma.subscription.deleteMany({ where: { user: emailFilter } });
  await prisma.subscriptionRequest.deleteMany({ where: { user: emailFilter } });
  await prisma.individual.deleteMany({ where: { user: emailFilter } });
  await prisma.business.deleteMany({ where: { user: emailFilter } });
  await prisma.user.deleteMany({ where: emailFilter });

  console.log('Creating users, profiles, and subscriptions...');
  const userMap = {};
  for (const u of users) {
    const hashed = await bcrypt.hash(DP, 10);
    const user = await prisma.user.create({
      data: { email: u.e, password: hashed, phone: u.ph, type: u.t, role: u.r, status: u.s, isVerified: true, profile_Photo: u.photo }
    });
    if (u.pr.k === 'individual') {
      await prisma.individual.create({ data: { user_ID: user.id, full_Name: u.pr.fn, nin: u.pr.ni, location: u.pr.lo } });
    } else {
      await prisma.business.create({ data: { user_ID: user.id, business_Name: u.pr.bn, rc_Number: u.pr.rc, form: u.pr.fo, nif: u.pr.nf, nis: u.pr.ns, locations: u.pr.ls } });
    }
    await prisma.subscription.create({
      data: {
        user_ID: user.id,
        tier: u.sub.tier,
        isActive: true,
        startDate: new Date(),
        endDate: u.sub.tier === 'FREE' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        shipmentsThisMonth: u.sub.sc,
        routesThisMonth: u.sub.rc,
        contactsCount: u.sub.cc,
      }
    });
    userMap[u.e] = user.id;
  }

  console.log('Creating vehicles...');
  for (const v of vehicles) {
    await prisma.vehicle.create({
      data: { plate_Number: v.pl, vehicle_Name: v.n, type: v.ty, color: v.cl, year: v.yr, capacity: v.cp, photo: v.ph, status: v.st, user_ID: userMap[v.em] }
    });
  }

  console.log('Creating shipments...');
  for (const s of shipments) {
    await prisma.shipment.create({
      data: { title: s.t, product_Type: s.pt, possible_Veh: s.pv, origin: s.o, destination: s.d, volume: s.v, weight: s.w, quantity: s.q, price: s.pr, date: s.dt, time: s.tm, priority: s.prr, special_Information: s.si, status: s.st, user_ID: userMap[s.e] }
    });
  }

  console.log('Creating routes...');
  for (const r of routes) {
    await prisma.route.create({
      data: { name: r.n, origin: r.o, destination: r.d, waypoints: r.wp, region: r.r, date: r.dt, post_type: r.pt, date_type: r.dtp, interval_start: r.is, interval_end: r.ie, more_Information: r.mi, status: r.st, user_ID: userMap[r.e], vehicle_plate: r.vp }
    });
  }

  console.log('Creating subscription requests...');
  for (const sr of subRequests) {
    await prisma.subscriptionRequest.create({
      data: { user_ID: userMap[sr.e], tier: sr.tier, status: sr.st, attachment: sr.att }
    });
  }

  console.log('Creating contacts...');
  for (const c of contacts) {
    await prisma.contact.create({ data: { user: userMap[c.ue], contactOf: userMap[c.ce] } });
  }

  console.log('Creating messages...');
  for (const m of messages) {
    await prisma.message.create({ data: { fromUser: userMap[m.f], toUser: userMap[m.t], msg: m.msg, image: m.img } });
  }

  console.log('Seed completed successfully!');
  console.log('');
  console.log('=== SPECIAL USERS ===');
  console.log('- ADMIN: Bouanani Sohaib (Medea) (BUSINESS tier, unlimited)');
  console.log('- FREE near limit: Allek Ilyes (Tizi Ouzou) (3/4 shipments, 3/4 routes, 1/2 contacts)');
  console.log('- FREE near limit: Hamoud Boualem (Algiers, Oran, Boumerdes) (3/4 shipments, 3/4 routes, 1/2 contacts)');
  console.log('- FREE pending request: Ghebache Mehdi (Algiers) (requesting INDIVIDUAL)');
  console.log('- FREE pending request: Keddam Youcef (Jijel) (2/4 shipments, 2/4 routes, 1/2 contacts, requesting BUSINESS)');
  console.log('');
  console.log('=== SUGGESTION MATCHES ===');
  console.log('- Ilyes shipment Tizi Ouzou->Boumerdes matches Hamoud route Oran->Boumerdes (partial)');
  console.log('- Ilyes shipment Tizi Ouzou->Algiers matches Cevital route Bejaia->Algiers (partial)');
  console.log('- Youcef shipment Jijel->Constantine matches Ramzi route Setif->Constantine (partial)');
  console.log('- Mehdi shipment Algiers->Setif matches Cosider route Algiers->Blida (partial)');
  console.log('- Saidal shipment Constantine->Medea matches Sohaib route Medea->Blida (partial)');
  console.log('- Condor shipment BBA->Setif matches Ramzi route Setif->BBA (reverse)');
  console.log('- Cevital shipment Algiers->Setif matches Cosider route Algiers->Blida (partial)');
  console.log('');
  console.log('=== SUBSCRIPTION SCENARIOS ===');
  console.log('- FREE tier: Ilyes (near all limits), Hamoud Boualem (near all limits), Mehdi (fresh), Youcef (2/4 ship, 2/4 routes, 1/2 contacts)');
  console.log('- INDIVIDUAL tier: Ramzi (5/100 ship, 3/100 routes, 8/15 contacts), Saidal (10/100 ship, 8/100 routes, 5/15 contacts)');
  console.log('- BUSINESS tier: Sohaib (admin, Medea), Cevital (Algiers, Bejaia, Setif), Condor (BBA, Algiers), Cosider (Algiers), Sonatrach (Algiers, Ouargla, Oran)');
  console.log('- Pending requests: Mehdi -> INDIVIDUAL, Youcef -> BUSINESS');
  console.log('');
  console.log('=== LOGIN CREDENTIALS ===');
  console.log('Password for all accounts:', DP);
  console.log('');
  for (const u of users) {
    console.log(`${u.pr.k === 'individual' ? u.pr.fn : u.pr.bn}: ${u.e} (${u.sub.tier})`);
  }
}

main().catch(e => { console.error('Seed failed:', e); process.exit(1); }).finally(() => prisma.$disconnect());

