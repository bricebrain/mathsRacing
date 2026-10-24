import { expect,it } from 'vitest';
import { RaceInterpolator } from './interpolation';
import { emptyRace } from '../shared/display';
import type { RoomView } from '../shared/protocol';
function snapshot(time:number,distance:number):RoomView {
 const state=emptyRace();state.time=time;state.players.forEach(p=>p.distance=distance);
 return {code:'ABC234',selfId:0,raceId:'race1',revision:time,serverTime:time+100000,startsAt:100000,phase:'racing',members:[],state,question:null,review:[],reason:null};
}
it('interpole les états espacés et plafonne la prédiction sans inventer de vainqueur',()=>{
 const interpolation=new RaceInterpolator(),first=snapshot(1000,52),next=snapshot(1200,62.4);
 interpolation.push(first);interpolation.push(next);
 expect(interpolation.sample(next,101280).players[0].distance).toBeCloseTo(57.2);
 const predicted=interpolation.sample(next,110000);
 expect(predicted.players[0].distance).toBeCloseTo(83.2);expect(predicted.winner).toBeNull();
});
it('réinitialise l’historique à la revanche et fige le résultat reçu du serveur',()=>{
 const interpolation=new RaceInterpolator(),view=snapshot(1000,52);interpolation.push(view);
 const next={...snapshot(0,0),raceId:'race2'};interpolation.push(next);
 expect(interpolation.sample(next,100000).players[0].distance).toBe(0);
 next.phase='finished';next.state.winner=1;
 expect(interpolation.sample(next,900000)).toEqual(next.state);
});
