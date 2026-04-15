/* add code after this comment */

const ul = document.getElementById("thumb-list");
ul.style = "border-style: inset; border-width: 1px; border-color: lightgray";

const p = document.querySelector("p");
const textarea = document.querySelector("textarea");
textarea.value = p.textContent;

const imgs = document.querySelectorAll("li img");
for (const img of imgs) img.style = "box-shadow: 2px 2px 5px 3px lightgray";
