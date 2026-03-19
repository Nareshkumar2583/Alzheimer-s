export function generateSequence(length){

let sequence=[]

for(let i=0;i<length;i++){

sequence.push(Math.floor(Math.random()*9)+1)

}

return sequence
}


export function checkSequence(user,target){

for(let i=0;i<user.length;i++){

if(user[i]!==target[i]) return false

}

return true

}