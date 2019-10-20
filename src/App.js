import React, {useState, useRef} from 'react';
import './App.css';
import Virtualist from "./Virtualist";
import faker from "faker"

function Message(props) {
    let [h, setState] = useState(props.h);
    return (
        <div className={"hoverstyle"}
             style={{...props.style, height: props.data.h, width: "100%", border: "1px solid black"}}>
            {
                props.data.id + "  :" + props.data.text
            }
            <button onClick={() => {
                let a = randomNumber();
                props.data.h = a;
                setState(a);
                props.reMeasure(props.data.id);
            }}>
                rnd h
            </button>
            <button onClick={() => {
                data = data.filter(elem => elem.id !== props.data.id);
                // props.deleteElement(props.data);
                props.updateState();
            }}>
                del
            </button>
        </div>
    )
}

let id = 1;

function randomNumber() {
    return faker.random.number({min: 45, max: 120});
}

function fake(count) {
    let res = [];
    for (var i = id; i < id + count; i++) {
        res.push({
            id: i,
            text: i === 9 ? faker.name.findName() + " wdaskdnskjdndsjfknsdkjnfkfjsndfkjsdfndkjfnsdkjfnsdkjfnskjfnsdjfk" : faker.name.findName(),
            h: randomNumber()
        })
    }
    id += count;
    return res;
}

let data = [];
data = fake(10);
let pend = "append";

function App() {
    const [state, setState] = useState(0);
    const listRef = useRef(null);

    return (
        <div className="App">
            <button onClick={() => setState(Math.random())}>Change state</button>
            <button onClick={() => {
                pend = "prepend";
                data.unshift(...fake(1000));
                setState(Math.random())
            }}>Prepend
            </button>
            <button onClick={() => {
                pend = "apppend";
                data.push(...fake(1000));
                setState(Math.random())
            }}>Append
            </button>
            <div style={{
                height: 550,
                width: 250,
                position: "absolute",
                top: 50,
                left: 450,
                borderColor: "red",
                border: 1,
                backgroundColor: "cyan"
            }}>
                <Virtualist
                    cacheId={1}
                    rowRenderer={function ({style, data, reMeasure, deleteElement}) {
                        return <Message style={style} updateState={() => setState(Math.random())} deleteElement={deleteElement} reMeasure={reMeasure}
                                        data={data} key={data.id}/>
                    }}
                    mode={pend}
                    data={data}
                    itemHeight={50}
                    computeKey={(data) => data.id}
                    resizeClientHandler={() => {
                    }}
                    resizeContentHandler={() => {
                    }}
                    listRef={listRef}
                    scrollHandler={() => {
                    }}
                    updateHandler={() => {
                    }}
                />
            </div>
        </div>
    );
}

export default App;
