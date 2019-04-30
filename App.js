import React from 'react';
import {StyleSheet, Text, View, AsyncStorage, TouchableOpacity} from 'react-native';
import {FileSystem} from 'expo';

export default class App extends React.Component{
	state={
		actions:["add", "delete", "move"],
		names:["a", "b", "c"],
		paths:["."],
	};

	async componentDidMount(){
		let paths=JSON.parse(await AsyncStorage.getItem('paths'));
		if(paths!==null){
			this.setState({paths});
		}
		this.random();
	}

	random=()=>{
		try{
			let actions=JSON.parse(JSON.stringify(this.state.actions));//deep copy
			let names=JSON.parse(JSON.stringify(this.state.names));
			let paths=JSON.parse(JSON.stringify(this.state.paths));

			let actionsIndex;
			if(paths.length===1){//路徑array為空，只能add
				actionsIndex=0;//0, add
			}
			else if(paths.length===2){//路徑array只有一個，只能add, delete
				actionsIndex=Math.floor(Math.random()*2);//0~1, add, delete
			}
			else{
				actionsIndex=Math.floor(Math.random()*3);//0~2, add, delete, move
			}
			let namesIndex=Math.floor(Math.random()*names.length);//add要加的資料夾名稱
			let randomTime=Math.floor(Math.random()*5)+5;

			let pathOriginal;
			let pathTarget;
			let pathNext;

			if(actions[actionsIndex]==="add"){//隨機取name，加入paths
				pathOriginal=paths[Math.floor(Math.random()*paths.length)];
				while(paths.includes(pathOriginal+"/"+names[namesIndex])){
					pathOriginal=paths[Math.floor(Math.random()*paths.length)];
				}
				paths.push(pathOriginal+"/"+names[namesIndex]);
			}
			else if(actions[actionsIndex]==="delete"){
				pathOriginal=paths[Math.floor(Math.random()*(paths.length-1))+1];//不能刪掉根目錄
				paths=paths.filter(e=>!e.includes(pathOriginal));//目標的子資料夾，路徑都會包含母資料夾路徑
			}
			else if(actions[actionsIndex]==="move"){//將隨機取到的paths的name切出來，刪除paths，加入隨機paths
				let isOneLine=paths.filter(e=>(e.match(/\//g)||[]).length===1).length===1;
				pathOriginal=paths[Math.floor(Math.random()*(paths.length-1))+1];//不能移動根目錄
				let isFirst=(pathOriginal.match(/\//g)||[]).length===1;
				//只有一條路徑，又選到first，沒地方可以move

				let temps=pathOriginal.split("/");
				temp=temps.pop();
				temps=temps.slice(1);
				let isAllParentsSame=temps.every(e=>e===temp);
				//只有一條路徑，選到的parents又都一樣，沒地方可以move
				if(isOneLine&&(isFirst||isAllParentsSame)){
					this.random();
					return;
				}

				//目標路徑有同名資料夾，就找其他的路徑，也不能移到自己下面
				pathTarget=paths[Math.floor(Math.random()*paths.length)];
				pathNext=pathTarget+"/"+temp;
				while(paths.includes(pathNext)||pathNext.includes(pathOriginal)){
					pathTarget=paths[Math.floor(Math.random()*paths.length)];
					pathNext=pathTarget+"/"+temp;
				}

				paths=paths.map(e=>e.replace(pathOriginal, pathNext));
			}

			this.setState({actionsIndex, namesIndex, pathOriginal, pathTarget, randomTime});

			setTimeout(async ()=>{
				this.setState({paths}, async ()=>{
					await AsyncStorage.setItem('paths', JSON.stringify(paths));
					this.random();
				});
			}, randomTime*1000);
		}
		catch(e){
			console.log(e);
		}
	};

	render(){
		const {
			actions,
			names,
			paths,
			namesIndex,
			actionsIndex,
			pathOriginal,
			pathTarget,
			randomTime,
		}=this.state;

		paths.sort();

		return (
			<View style={styles.container}>
				<Text>下一步動作：{actions[actionsIndex]}</Text>
				{actions[actionsIndex]==="add"?
					<Text>將{names[namesIndex]}資料夾，加到路徑{pathOriginal}</Text>
				:actions[actionsIndex]==="move"?
					<Text>將路徑{pathOriginal}，移動到{pathTarget}（包含子資料夾）</Text>
				:
					<Text>將路徑{pathOriginal}刪掉（包含子資料夾）</Text>
				}
				<Text>幾秒後動作：{randomTime}</Text>

				<View>
					{paths.map((e, i)=>{
						let folders=e.split("/");
						return <Text
							key={i}
							style={{marginLeft:folders.length*10}}>{folders[folders.length-1]}
						</Text>;
					})}
				</View>

				<TouchableOpacity onPress={async ()=>{
					await AsyncStorage.removeItem('paths');
					this.setState({paths:["."]});
				}}>
					<Text style={{marginTop:50}}>遊戲重來</Text>
				</TouchableOpacity>
			</View>
		);
	}
}

const styles=StyleSheet.create({
	container:{
		flex:1,
		backgroundColor:'#fff',
		alignItems:'center',
		justifyContent:'center',
	},
});
