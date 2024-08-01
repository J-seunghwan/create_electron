const { ipcRenderer } = require('electron');

const btn_path_select = document.getElementById('btn_path_select');
const btn_gen = document.getElementById('btn_gen');
const input_proj_name = document.getElementById('input_proj_name');
const input_proj_path = document.getElementById('input_proj_path');
const input_main_name = document.getElementById('input_main_name');
const input_preload_name = document.getElementById('input_preload_name');
const input_html_name = document.getElementById('input_html_name');
const input_css_name = document.getElementById('input_css_name');
const input_js_name = document.getElementById('input_js_name');
const p_warn_name = document.getElementById('p_warn_name');
const p_warn_path = document.getElementById('p_warn_path');
const p_warn_main = document.getElementById('p_warn_main');
const p_warn_prelaod = document.getElementById('p_warn_preload');
const p_warn_html = document.getElementById('p_warn_html');
const p_warn_css = document.getElementById('p_warn_css');
const p_warn_js = document.getElementById('p_warn_js');
const layout_gen = document.getElementById("layout_gen");
const span_gen = document.getElementById("span_gen");

const warn_text = "비어있거나 잘못된 이름";
const warn_color = "#ff0055";

function isCorrectName(element, output, extension,){
    // 순서 필수
    // 1. 문자열 첫번째가 숫자인가
    // 2. 타입에 맞게 분리
    // 2.1 폴더라면
    //     1. 영어 소문자 및 숫자만 사용
    //     2. 이름 공백인지
    // 2.2 파일이라면
    //     1. 확장자 앞부분 이름 존재 및 영어와 숫자만 사용
    //     2. 확장자 일치 여부
    //     3. 공백인지 -> 기본 적용 이름을 사용하기 때문

    let uncorrect = false;
    const value = element.value;

    if(/^[0-9]+$/.test(value[0]) == true){
        uncorrect = true; //숫자로 시작 안됨
    }

    if (extension == "folder"){
        if(/^[a-z0-9]+$/.test(value) == false){
            uncorrect = true; //영어 소문자와 숫자 가능, 대문자 불가
        }
        if(value == ""){
            uncorrect = true; //프로젝트 이름은 공백 안됨
        }
    }
    else{ // .js .html .css
        const len = extension.length;
        if(/^[a-zA-Z0-9]+$/.test(value.split('.')[0]) == false){
            uncorrect = true; // 확장자 앞부분 이름 유효성 검사
        }
        if(value.slice(-1*len) != extension){
            uncorrect = true; // 확장자 일치 여부
        }
        if(value == ""){
            uncorrect = false; // 공백이면 통과. 공백이면 기본 이름 적용
        }
    }

    if(uncorrect){
        document.getElementById(output).innerText = warn_text;
        element.style.borderColor = warn_color;
    }
    else {
        document.getElementById(output).innerText = "";
        element.style.borderColor = "initial";
    }
}

input_proj_name.oninput = (event) => {
    isCorrectName(input_proj_name, "p_warn_name", "folder");
}

input_main_name.oninput = (event) => {
    isCorrectName(input_main_name, "p_warn_main", ".js");
}

input_preload_name.oninput = (event) => {
    isCorrectName(input_preload_name, "p_warn_preload", ".js");
}

input_html_name.oninput = (event) => {
    isCorrectName(input_html_name, "p_warn_html", ".html");
}

input_css_name.oninput = (event) => {
    isCorrectName(input_css_name, "p_warn_css", ".css");
}

input_js_name.oninput = (event) => {
    isCorrectName(input_js_name, "p_warn_js", ".js");
}

btn_path_select.addEventListener('click', async () => {
    const path = await ipcRenderer.invoke('open-directory-dialog');
    if (path) {
        input_proj_path.value = `${path}`;
        input_proj_path.style.borderColor = "initial";
        p_warn_path.innerText = "";
    }
});

btn_gen.addEventListener('click', function () {
    let arr = [];

    //경고 표시없고 빈칸이 아닐때
    if (p_warn_name.innerText == "" && input_proj_name.value != ""){
        arr[0] = input_proj_name.value;
    }
    else{
        input_proj_name.style.borderColor = warn_color;
        p_warn_name.innerText = warn_text;
        return;
    }
    
    if (input_proj_path.value != ""){
        arr[1] = input_proj_path.value;
    }
    else{
        input_proj_path.style.borderColor = warn_color;
        p_warn_path.innerText = warn_text;
        return;
    }

    // ***************************************** the default name is decided
    const input_file_array = [input_main_name, input_preload_name, input_html_name, input_css_name, input_js_name];
    const p_warn_array = [p_warn_main, p_warn_prelaod, p_warn_html, p_warn_css, p_warn_js];
    const default_name = ["main.js", "preload.js", "index.html", "style.css", "renderer.js"];

    for(let i=0; i<p_warn_array.length; i++){
        if (input_file_array[i].value == ""){
            arr[i+2] = default_name[i];
        }
        else if(p_warn_array[i].innerText == ""){
            arr[i+2] = input_file_array[i].value;
        }
        else{
            input_file_array[i].style.borderColor = warn_color;
            p_warn_array[i].innerText = warn_text;
            return;
        }
    }

    const value = document.querySelector('input[name="radio1"]:checked').value;
    if(value == 1){
        arr[7] = "empty";
    }
    else if(value == 2){
        arr[7] = "hello";
    }

    layout_gen.style.width = "100%";
    layout_gen.style.height = "100%";
    span_gen.innerText = "생성중";

    ipcRenderer.send("file-info", arr);
})

ipcRenderer.on("finish", (event, args) => {
    layout_gen.style.width = "0%";
    layout_gen.style.height = "0%";
    span_gen.innerText = "";
    if(args == "overlap"){
        //alert 이후에 제대로 동작안하는 이유는?
        input_proj_name.style.borderColor = warn_color;
        p_warn_name.innerText = "중복된 이름";
    }
})