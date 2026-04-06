let currCount = 0;

const body = document.querySelector("body");
const h1 = document.createElement("h1");
h1.textContent = "DOM Manipulation Lesson";

const fieldset = document.createElement("fieldset");
const legend = document.createElement("legend");
legend.textContent = "counter";

const input = document.createElement("input");
input.name = "curr";
input.id = "curr";
input.value = currCount;

const count = document.createElement("button");
count.textContent = "Count";

const less = document.createElement("button");
less.textContent = "Less";

const reset = document.createElement("button");
reset.textContent = "Reset";

///Event loops

count.addEventListener("click", (e) => {
  input.value = ++currCount;
});

less.addEventListener("click", (e) => {
  input.value = --currCount;
});

reset.addEventListener("click", (e) => {
  input.value = 0;
});

body.appendChild(h1);
body.appendChild(fieldset);
fieldset.appendChild(legend);
fieldset.appendChild(input);
fieldset.appendChild(count);
fieldset.appendChild(less);
fieldset.appendChild(reset);
