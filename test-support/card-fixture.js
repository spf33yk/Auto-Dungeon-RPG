import{cardCatalog}from'../card-catalog.js';
// Existing AI/editor suites exercise combinations after acquisition. Skill activation
// remains separately controlled by their abilities/unlockedOrders fixtures.
export function withCardInventory(s,includeRewards=true){s.augmentStarted=true;s.ownedCards=cardCatalog.filter(c=>includeRewards||(c.kind!=='skill'&&c.id!=='avoid-traps')).map(c=>c.key);s.profile.cards=[...s.ownedCards];return s;}
