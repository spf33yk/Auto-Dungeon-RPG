// Provisional character growth; distinct from memory skill upgrade levels.
export const MAX_LEVEL=30,HP_PER_LEVEL=3;
export const experienceToNext=level=>level>=MAX_LEVEL?0:10+(level-1)*5;
export function gainExperience(s,amount){
 if(!Number.isSafeInteger(amount)||amount<=0||s.level>=MAX_LEVEL)return 0;
 s.experience+=amount;let gained=0;
 while(s.level<MAX_LEVEL&&s.experience>=experienceToNext(s.level)){
  s.experience-=experienceToNext(s.level);s.level++;s.hp+=HP_PER_LEVEL;gained++;
 }
 if(s.level===MAX_LEVEL)s.experience=0;
 return gained;
}
