import { Question } from './movie';
export const QUESTIONS: Question[] = [
 {id:'mood',title:'What’s your mood?',subtitle:'Every mood deserves a good movie. What’s yours today?',options:[{value:'Bored',icon:'🥱',detail:'Entertain me, please'},{value:'Tired',icon:'😴',detail:'Something easy to sink into'},{value:'Excited',icon:'🤩',detail:'Keep the energy going'},{value:'Sad',icon:'🥺',detail:'A little pick-me-up'},{value:'Nostalgic',icon:'📼',detail:'Take me back in time'}]},
 {id:'genre',title:'Pick your kind of story.',subtitle:'A little action? A lot of laughs? You call the shots.',options:[{value:'Action',icon:'💥'},{value:'Comedy',icon:'😂'},{value:'Romance',icon:'💕'},{value:'Family',icon:'🏡'},{value:'Thriller',icon:'🔍'},{value:'Fantasy',icon:'✨'}]},
 {id:'company',title:'Who’s watching with you?',subtitle:'Good company makes a great movie even better.',options:[{value:'Alone',icon:'🎧'},{value:'Friends',icon:'🍿'},{value:'Family',icon:'🛋️'},{value:'Partner',icon:'💛'}]},
 {id:'time',title:'How much time have you got?',subtitle:'Let’s find a story that fits your movie break.',options:[{value:'Under 2 hrs',icon:'⏱️'},{value:'2-3 hrs',icon:'🎬'},{value:"Doesn't matter",icon:'♾️'}]},
 {id:'era',title:'Choose your cinema era.',subtitle:'Old-school magic or the latest big-screen energy?',options:[{value:'Classic (before 2000)',icon:'📽️'},{value:'2000-2010',icon:'💿'},{value:'2010-2020',icon:'🎞️'},{value:'Recent',icon:'🌟'}]},
];
