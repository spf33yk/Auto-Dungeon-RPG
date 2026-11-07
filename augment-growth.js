// Provisional, explicit values for no stars / 1 / 2 / 3 stars. No generic multiplier.
export const AUGMENT_GROWTH={
 'map-reader':{sight:[1,1,2,2],duration:[5,7,7,10]},
 scavenger:{extra:[1,2,3,4]},
 'swift-ascent':{heal:[.15,.18,.21,.25]},
 trailblazer:{step:[1,1.25,1.65,2.25],cap:[5,6.25,8.25,11.25]},
 'treasure-sense':{candidates:[4,5,6,8]},
 pioneer:{heal:[.2,.25,.35,.5],shards:[8,12,20,36],attack:[5,7,11,18]},
 ripen:{step:[1,1.2,1.4,1.65],cap:[5,6,7,8.25]},
 patience:{step:[1,1.2,1.4,1.65],cap:[3,3.6,4.2,4.95]},
 breath:{heal:[.03,.035,.04,.05],uses:[5,6,7,8]},
 pilgrim:{step:[1,1.25,1.65,2.25],cap:[15,18.75,24.75,33.75]},
 charge:{damage:[2,2.3,2.8,3.5]},
 enlightenment:{perCharge:[.25,.35,.55,.9]},
 desperate:{step:[1,1.2,1.4,1.65],cap:[9,10.8,12.6,14.85]},
 leech:{rate:[.03,.04,.05,.06]},
 surrounded:{step:[1,1.2,1.4,1.65],cap:[5,6,7,8.25]},
 blood:{rate:[.2,.25,.33,.45]},
 hunter:{step:[.04,.05,.066,.09],cap:[.4,.5,.66,.9]},
 'blood-pact':{damage:[1.5,1.7,2.1,2.8],leech:[.15,.2,.3,.5]},
 shell:{defense:[3,3.6,4.2,5]},
 'first-shield':{reduction:[.5,.6,.7,.85]},
 restful:{heal:[.05,.06,.07,.085]},
 moon:{damage:[1.5,1.8,2.25,3]},
 reserve:{reduction:[.3,.375,.5,.7]},
 undying:{immunity:[1,2,3,5]},
 critical:{chance:[.1,.12,.14,.17]},
 'risky-blade':{damage:[1.3,1.4,1.5,1.65]},
 'lucky-find':{chance:[.25,.3,.35,.425]},
 'double-strike':{chance:[.15,.2,.28,.4]},
 pity:{step:[.05,.065,.09,.13],cap:[.3,.39,.54,.78]},
 destiny:{chance:[.5,.6,.75,1],consolation:[10,12,16,24]}
};
for(const row of Object.values(AUGMENT_GROWTH)){for(const values of Object.values(row))Object.freeze(values);Object.freeze(row);}Object.freeze(AUGMENT_GROWTH);
export function growthAt(id,stars=0){const row=AUGMENT_GROWTH[id];if(!row)throw Error('Unknown augment growth: '+id);if(!Number.isInteger(stars)||stars<0||stars>3)throw Error('Invalid star level');return Object.fromEntries(Object.entries(row).map(([key,values])=>[key,values[stars]]));}
export const growthNumber=n=>Number(n.toFixed(6)).toString();
