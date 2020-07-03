import React, { useContext, useState } from 'react';
import ChatRoom from '../components/ChatRoom';
import '../style/index.less';
import { Context } from '../context/index';

const userState = (username) => {
    const [user, setUsername] = useState(username);
    return [user, setUsername];
};
// 生成随机uid
const generateUid = () => String(new Date().getTime()) + Math.floor(Math.random() * 999 + 1);

const App = props => {
    // 获取context中的数据
    const { state, dispatch } = useContext(Context);

    // 输入输出用户名
    const [user, setUsername] = userState(null);
    // 登录
    const handleLogin = () => {
        const uid = generateUid();
        const username = user ? user : `游客${uid}`;
        // 储存用户信息（uid、username）
        dispatch({ type: 'LOGIN', payload: { uid, username } });
        // 通知服务器-- 我登录了， 并把登录信息发过去
        state.socket.emit('login', { uid, username });
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
        return false;
    };
    return (
        <div>
            {state.uid ? (
                // 已登录
                <ChatRoom uid={state.uid} username={state.username} socket={state.socket} />
            ) : (
                    // 登录界面
                    <div className="login-box">
                        <h2>登 陆</h2>
                        <div className="input">
                            <input type="text" placeholder="请输入用户名" onChange={(e) => setUsername(e.target.value)} onKeyPress={handleKeyPress} />
                        </div>
                        <div className="submit">
                            <button type="button" onClick={handleLogin}>
                                提交
                            </button>
                        </div>
                    </div>
                )}
        </div>
    );
};
export default App;
