let recentProducts =
JSON.parse(localStorage.getItem("recentProducts")) || [];

let productStore = {};

let customerStore =
[];
async function initCustomers(){

    const cloudCustomers =
    await loadCustomersFromSupabase();

    if(
        cloudCustomers &&
        cloudCustomers.length > 0
    ){

        customerStore =
        cloudCustomers.map(
            item=>item.name
        );

    }else{

        customerStore =
        JSON.parse(
            localStorage.getItem(
                "customerStore"
            )
        ) || CUSTOMERS;

    }

    loadCustomers();
renderHotCustomers();
renderManageCustomerList();
updateCurrentCustomerBox();

}

async function initProducts(){

    const cloudProducts =
    await loadProductsFromSupabase();
    console.log("雲端商品資料", cloudProducts);

    if(
        cloudProducts &&
        cloudProducts.length > 0
    ){

        productStore = {};

        cloudProducts.forEach(item=>{

            if(!productStore[item.category]){
                productStore[item.category] = [];
            }

            productStore[item.category].push(
                item.name
            );

        });

    }else{

        productStore =
        JSON.parse(
            localStorage.getItem(
                "productStore"
            )
        ) || PRODUCTS;

    }

    renderProducts();
    renderManageProductList();

}

async function initHistory(){

    const cloudOrders =
    await loadOrdersFromSupabase();

    if(
        cloudOrders &&
        cloudOrders.length > 0
    ){

        historyOrders =
        cloudOrders;

    }else{

        historyOrders =
        JSON.parse(
            localStorage.getItem(
                "historyOrders"
            )
        ) || [];

    }

    renderHistory();
    renderTodayStats();
    renderMonthStats();
    renderMonthReport();
    renderCustomerRanking();
    renderProductRanking();
    renderMonthCustomerRanking();
    renderMonthProductRanking();

}

let orderItems =
JSON.parse(localStorage.getItem("orderItems")) || [];

let currentCustomer =
localStorage.getItem("currentCustomer") || "";

let historyOrders =
JSON.parse(localStorage.getItem("historyOrders")) || [];

let currentProduct = "";
let editIndex = null;

const orderList = document.getElementById("orderList");
const totalElement = document.querySelector(".total");
const customerSelect = document.getElementById("customerSelect");
const currentCustomerBox = document.getElementById("currentCustomerBox");
const hotCustomerGrid = document.getElementById("hotCustomerGrid");

const modal = document.getElementById("productModal");
const modalTitle = document.getElementById("modalTitle");
const qtyInput = document.getElementById("qtyInput");
const unitInput = document.getElementById("unitInput");
const amountInput = document.getElementById("amountInput");
const unitPriceInput = document.getElementById("unitPriceInput");
const priceModeInput = document.getElementById("priceModeInput");
const weightInput = document.getElementById("weightInput");
const remarkInput = document.getElementById("remarkInput");

const historyList = document.getElementById("historyList");
const historySearch =
document.getElementById("historySearch");
const historyTab = document.getElementById("historyTab");
const productManageTab =
document.getElementById(
    "productManageTab"
);

const productManagePage =
document.getElementById(
    "productManagePage"
);
const historyPage = document.getElementById("historyPage");

const productSearch = document.getElementById("productSearch");
const productGrid = document.getElementById("productGrid");
const recentProductGrid = document.getElementById("recentProductGrid");
const receiptModal =
document.getElementById("receiptModal");

const receiptPreview =
document.getElementById("receiptPreview");

const receiptCancelBtn =
document.getElementById("receiptCancelBtn");

const copyReceiptBtn =
document.getElementById("copyReceiptBtn");

const confirmCheckoutBtn =
document.getElementById("confirmCheckoutBtn");

let pendingOrder = null;

let historyFilter = "all";

const todayStats =
document.getElementById(
    "todayStats"
);

const monthStats =
document.getElementById(
    "monthStats"
);

const customerRanking =
document.getElementById(
    "customerRanking"
);

const productRanking =
document.getElementById(
    "productRanking"
);

const monthReport =
document.getElementById(
    "monthReport"
);

const monthCustomerRanking =
document.getElementById(
    "monthCustomerRanking"
);

const monthProductRanking =
document.getElementById(
    "monthProductRanking"
);

function autoCalculateAmount(){

    if(priceModeInput.value !== "fixed"){
        return;
    }

    const qty =
    Number(qtyInput.value);

    const unitPrice =
    Number(unitPriceInput.value);

    if(!qty || !unitPrice){
        return;
    }

    amountInput.value =
    Math.round(qty * unitPrice);

}

qtyInput.addEventListener(
    "input",
    autoCalculateAmount
);

unitPriceInput.addEventListener(
    "input",
    autoCalculateAmount
);

function formatWeightInput(value){

    if(!value) return "";

    const text =
    value.trim();

    if(!text.includes("-")){
        return text;
    }

    const parts =
    text.split("-");

    const jin =
    Number(parts[0]);

    const liang =
    Number(parts[1]);

    if(isNaN(jin) || isNaN(liang)){
        return text;
    }

    if(jin === 0 && liang > 0){
        return `${liang}兩`;
    }

    if(liang === 0){
        return `${jin}斤`;
    }

    return `${jin}斤${liang}兩`;

}

function saveCurrentOrder(){
    localStorage.setItem("orderItems", JSON.stringify(orderItems));
}

function renderOrderList(){
    if(orderItems.length === 0){
        orderList.innerHTML = "尚未加入商品";
        totalElement.innerHTML = "合計：$0";
        return;
    }

    let total = 0;
    orderList.innerHTML = "";

    orderItems.forEach((item,index)=>{
        total += parseFloat(item.amount) || 0;

        const row = document.createElement("div");
        row.className = "order-row";

        row.innerHTML = `
            <div onclick="editItem(${index})" style="flex:1;cursor:pointer;">
                <strong>${item.name}</strong>
${item.remark ? `(${item.remark})` : ""}
　${getItemQtyText(item)}
　$${item.amount}
            </div>

            <button onclick="removeItem(${index})">✕</button>
        `;

        orderList.appendChild(row);
    });

    totalElement.innerHTML = `合計：$${total}`;
}

function removeItem(index){
    orderItems.splice(index,1);
    saveCurrentOrder();
    renderOrderList();
}

function editItem(index){
    const item = orderItems[index];

    currentProduct = item.name;
    editIndex = index;

    modalTitle.innerText = item.name;
    priceModeInput.value =
item.priceMode || "fixed";

qtyInput.value =
item.qty || "";

unitInput.value =
item.unit || "包";

unitPriceInput.value =
item.unitPrice || "";

amountInput.value =
item.amount || "";

weightInput.value =
item.weight || "";

remarkInput.value =
item.remark || "";

    modal.classList.add("show");
}

function addProduct(productName){

    currentProduct = productName;
    editIndex = null;

    modalTitle.innerText = productName;

    priceModeInput.value = "fixed";

    qtyInput.value = "";
    unitInput.value = "包";
    unitPriceInput.value = "";
    amountInput.value = "";
    weightInput.value = "";
    remarkInput.value = "";

    modal.classList.add("show");

}

function saveRecentProduct(productName){
    recentProducts = recentProducts.filter(name => name !== productName);
    recentProducts.unshift(productName);
    recentProducts = recentProducts.slice(0, 8);

    localStorage.setItem("recentProducts", JSON.stringify(recentProducts));

    renderRecentProducts();
}

function renderRecentProducts(){
    if(!recentProductGrid) return;

    recentProductGrid.innerHTML = "";

    if(recentProducts.length === 0){
        recentProductGrid.innerHTML = `<div class="empty-text">尚無最近使用商品</div>`;
        return;
    }

    recentProducts.forEach(name=>{
        const btn = document.createElement("button");
        btn.innerText = name;

        btn.addEventListener("click",()=>{
            addProduct(name);
        });

        recentProductGrid.appendChild(btn);
    });
}

function loadCustomers(){
    customerSelect.innerHTML = "";

    customerStore.forEach(customer=>{
        const option = document.createElement("option");
        option.value = customer;
        option.textContent = customer;
        customerSelect.appendChild(option);
    });

    if(currentCustomer){
        customerSelect.value = currentCustomer;
    }else{
        currentCustomer = customerSelect.value;
        localStorage.setItem("currentCustomer", currentCustomer);
    }

    updateCurrentCustomerBox();
}

function updateCurrentCustomerBox(){
    currentCustomerBox.innerText =
    currentCustomer
    ? `目前客戶：${currentCustomer}`
    : "目前客戶：尚未選擇";
}

function renderHotCustomers(){
    hotCustomerGrid.innerHTML = "";

    HOT_CUSTOMERS.forEach(customer=>{
        const button = document.createElement("button");
        button.innerText = customer;

        button.addEventListener("click",()=>{
            currentCustomer = customer;
            customerSelect.value = customer;

            localStorage.setItem("currentCustomer", currentCustomer);

            updateCurrentCustomerBox();
        });

        hotCustomerGrid.appendChild(button);
    });
}


function renderManageCustomerList(){

    const list =
    document.getElementById("manageCustomerList");

    if(!list) return;

    list.innerHTML = "";

    customerStore.forEach(name=>{

        const row =
        document.createElement("div");

        row.className =
        "manage-product-row";

        row.innerHTML = `
            <span>${name}</span>

            <div>
                <button onclick="renameCustomer('${name}')">
                    ✏️
                </button>

                <button onclick="deleteCustomer('${name}')">
                    🗑️
                </button>
            </div>
        `;

        list.appendChild(row);

    });

}

function renderProducts(category = "all"){
    productGrid.innerHTML = "";

    let products = [];

    if(category === "all"){
       Object.values(productStore).forEach(group=>{
            products = products.concat(group);
        });
    }else{
        products = productStore[category]|| [];
    }

    products.forEach(name=>{
        const btn = document.createElement("button");
        btn.innerText = name;

        btn.addEventListener("click",()=>{
            addProduct(name);
        });

        productGrid.appendChild(btn);
    });
}

function renderManageProductList(){

    const list =
    document.getElementById(
        "manageProductList"
    );

    if(!list) return;

    list.innerHTML = "";

    Object.entries(productStore)
    .forEach(([category,products])=>{

        products.forEach(name=>{

            const row =
            document.createElement("div");

            row.className =
            "manage-product-row";

          row.innerHTML = `
    <span>${name}</span>

    <div>
        <button
            onclick="renameProduct('${category}','${name}')">
            ✏️
        </button>

        <button
            onclick="deleteProduct('${category}','${name}')">
            🗑️
        </button>
    </div>
`;
            list.appendChild(row);

        });

    });

}

async function deleteHistoryOrder(id){

    const confirmDelete =
    confirm("確定要刪除這筆歷史紀錄嗎？");

    if(!confirmDelete) return;

    const success =
    await deleteOrderFromSupabase(id);

    if(!success){

        alert("刪除失敗");

        return;

    }

    await initHistory();

    alert("歷史紀錄已刪除");

}

async function renameProduct(category,name){

    const newName =
    prompt("請輸入新的商品名稱", name);

    if(!newName) return;

    const trimmedName =
    newName.trim();

    if(!trimmedName) return;

    if(
        productStore[category] &&
        productStore[category].includes(trimmedName)
    ){
        alert("這個商品名稱已經存在");
        return;
    }

    const success =
    await updateProductInSupabase(
        category,
        name,
        trimmedName
    );

    if(!success){

        alert("修改失敗");

        return;

    }

    recentProducts =
    recentProducts.map(item=>{

        if(item === name){
            return trimmedName;
        }

        return item;

    });

    orderItems =
    orderItems.map(item=>{

        if(item.name === name){
            return {
                ...item,
                name: trimmedName
            };
        }

        return item;

    });

    localStorage.setItem(
        "recentProducts",
        JSON.stringify(recentProducts)
    );

    saveCurrentOrder();

    await initProducts();

    renderRecentProducts();
    renderOrderList();

    alert("商品名稱修改成功");

}

async function deleteProduct(category,name){

    const confirmDelete =
    confirm(`確定刪除 ${name} 嗎？`);

    if(!confirmDelete) return;

    const success =
    await deleteProductFromSupabase(
        category,
        name
    );

    if(!success){

        alert("刪除失敗");

        return;

    }

    recentProducts =
    recentProducts.filter(
        item=>item !== name
    );

    localStorage.setItem(
        "recentProducts",
        JSON.stringify(recentProducts)
    );

    await initProducts();

    renderRecentProducts();

    alert("商品刪除成功");

}

async function deleteCustomer(name){

    const confirmDelete =
    confirm(`確定刪除 ${name} 嗎？`);

    if(!confirmDelete) return;

    const success =
    await deleteCustomerFromSupabase(name);

    if(!success){
        alert("刪除失敗");
        return;
    }

    if(currentCustomer === name){
        currentCustomer = "";
        localStorage.setItem("currentCustomer", currentCustomer);
    }

    await initCustomers();

    alert("客戶刪除成功");

}

async function renameCustomer(name){

    const newName =
    prompt(
        "請輸入新的客戶名稱",
        name
    );

    if(!newName) return;

    const trimmedName =
    newName.trim();

    if(!trimmedName) return;

    if(
        customerStore.includes(
            trimmedName
        )
    ){
        alert("客戶名稱已存在");
        return;
    }

    const success =
    await updateCustomerInSupabase(
        name,
        trimmedName
    );

    if(!success){

        alert("修改失敗");

        return;

    }

    if(currentCustomer === name){

        currentCustomer =
        trimmedName;

        localStorage.setItem(
            "currentCustomer",
            currentCustomer
        );

    }

    await initCustomers();

    alert("客戶名稱修改成功");

}

function renderTodayStats(){

    const now =
    new Date();

    let count = 0;
    let total = 0;

    historyOrders.forEach(order=>{

        const date =
        new Date(order.date);

        if(

            date.getFullYear() ===
            now.getFullYear()

            &&

            date.getMonth() ===
            now.getMonth()

            &&

            date.getDate() ===
            now.getDate()

        ){

            count++;

            total +=
            Number(order.total);

        }

    });

    todayStats.innerHTML = `
        出貨筆數：${count}<br>
        今日營收：$${total}
    `;

}

function renderMonthStats(){

    const now = new Date();

    const year =
    now.getFullYear();

    const month =
    now.getMonth() + 1;

    let total = 0;

    historyOrders.forEach(order=>{

        const date =
        new Date(order.date);

        if(
            date.getFullYear() === year &&
            date.getMonth() + 1 === month
        ){

            total +=
            Number(order.total);

        }

    });

    monthStats.innerHTML =
    `本月營收：$${total}`;

}

function renderMonthReport(){

    if(!monthReport) return;

    const now =
    new Date();

    const year =
    now.getFullYear();

    const month =
    now.getMonth();

    let revenue = 0;

    let orderCount = 0;

    const customers =
    new Set();

    historyOrders.forEach(order=>{

        const date =
        new Date(order.date);

        if(
            date.getFullYear() === year
            &&
            date.getMonth() === month
        ){

            revenue +=
            Number(order.total);

            orderCount++;

            customers.add(
                order.customer
            );

        }

    });

    const avgOrder =

    orderCount > 0

    ?

    Math.round(
        revenue / orderCount
    )

    :

    0;

    monthReport.innerHTML = `

        <div>
            💰 本月營收：
            $${revenue}
        </div>

        <div>
            📦 本月出貨：
            ${orderCount}筆
        </div>

        <div>
            👤 本月客戶：
            ${customers.size}家
        </div>

        <div>
            🧾 平均客單價：
            $${avgOrder}
        </div>

    `;

}

function renderCustomerRanking(){

    if(!customerRanking) return;

    const today =
    new Date()
    .toLocaleDateString("zh-TW");

    const customerTotals = {};

    historyOrders.forEach(order=>{

        if(
            !order.date.includes(today)
        ) return;

        if(
            !customerTotals[order.customer]
        ){
            customerTotals[order.customer] = 0;
        }

        customerTotals[order.customer] +=
        Number(order.total);

    });

    const ranking =
    Object.entries(customerTotals)
    .sort((a,b)=>b[1]-a[1]);

    if(ranking.length === 0){

        customerRanking.innerHTML =
        "尚無資料";

        return;
    }

    customerRanking.innerHTML = "";

    ranking.forEach(
    ([customer,total],index)=>{

        let medal = "";

        if(index === 0) medal = "🥇";
        else if(index === 1) medal = "🥈";
        else if(index === 2) medal = "🥉";

        const row =
        document.createElement("div");

        row.className =
        "ranking-row";

        row.innerHTML = `
            <span>
                ${medal} ${customer}
            </span>

            <span>
                $${total}
            </span>
        `;

        customerRanking.appendChild(row);

    });

}

function renderMonthCustomerRanking(){

    if(!monthCustomerRanking) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const customerTotals = {};

    historyOrders.forEach(order=>{

        const date = new Date(order.date);

        if(
            date.getFullYear() !== year ||
            date.getMonth() !== month
        ) return;

        if(!customerTotals[order.customer]){
            customerTotals[order.customer] = 0;
        }

        customerTotals[order.customer] +=
        Number(order.total);

    });

    const ranking =
    Object.entries(customerTotals)
    .sort((a,b)=>b[1]-a[1]);

    if(ranking.length === 0){
        monthCustomerRanking.innerHTML = "尚無資料";
        return;
    }

    monthCustomerRanking.innerHTML = "";

    ranking.forEach(([customer,total],index)=>{

        let medal = "";

        if(index === 0) medal = "🥇";
        else if(index === 1) medal = "🥈";
        else if(index === 2) medal = "🥉";

        const row = document.createElement("div");

        row.className = "ranking-row";

        row.innerHTML = `
            <span>${medal} ${customer}</span>
            <span>$${total}</span>
        `;

        monthCustomerRanking.appendChild(row);

    });

}

function renderProductRanking(){

    if(!productRanking) return;

    const today =
    new Date()
    .toLocaleDateString("zh-TW");

    const productTotals = {};

    historyOrders.forEach(order=>{

        if(!order.date.includes(today)) return;

        order.items.forEach(item=>{

            if(!productTotals[item.name]){
                productTotals[item.name] = 0;
            }

            productTotals[item.name] +=
            Number(item.amount);

        });

    });

    const ranking =
    Object.entries(productTotals)
    .sort((a,b)=>b[1]-a[1]);

    if(ranking.length === 0){

        productRanking.innerHTML =
        "尚無資料";

        return;
    }

    productRanking.innerHTML = "";

    ranking.forEach(([product,total],index)=>{

        let medal = "";

        if(index === 0) medal = "🥇";
        else if(index === 1) medal = "🥈";
        else if(index === 2) medal = "🥉";

        const row =
        document.createElement("div");

        row.className =
        "ranking-row";

        row.innerHTML = `
            <span>${medal} ${product}</span>
            <span>$${total}</span>
        `;

        productRanking.appendChild(row);

    });

}

function renderMonthProductRanking(){

    if(!monthProductRanking) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const productTotals = {};

    historyOrders.forEach(order=>{

        const date = new Date(order.date);

        if(
            date.getFullYear() !== year ||
            date.getMonth() !== month
        ) return;

        order.items.forEach(item=>{

            if(!productTotals[item.name]){
                productTotals[item.name] = 0;
            }

            productTotals[item.name] +=
            Number(item.amount);

        });

    });

    const ranking =
    Object.entries(productTotals)
    .sort((a,b)=>b[1]-a[1]);

    if(ranking.length === 0){
        monthProductRanking.innerHTML = "尚無資料";
        return;
    }

    monthProductRanking.innerHTML = "";

    ranking.forEach(([product,total],index)=>{

        let medal = "";

        if(index === 0) medal = "🥇";
        else if(index === 1) medal = "🥈";
        else if(index === 2) medal = "🥉";

        const row = document.createElement("div");

        row.className = "ranking-row";

        row.innerHTML = `
            <span>${medal} ${product}</span>
            <span>$${total}</span>
        `;

        monthProductRanking.appendChild(row);

    });

}

function renderHistory(){
    historyList.innerHTML = "";

    let orders =
[...historyOrders];
const keyword =
historySearch
? historySearch.value.trim().toLowerCase()
: "";
const now =
new Date();

if(historyFilter === "today"){

    orders =
    orders.filter(order=>{

        const date =
        new Date(order.date);

        return (
            date.toDateString() ===
            now.toDateString()
        );

    });

}

if(historyFilter === "week"){

    orders =
    orders.filter(order=>{

        const date =
        new Date(order.date);

        const diff =
        (now - date) /
        (1000*60*60*24);

        return diff <= 7;

    });

}

if(historyFilter === "month"){

    orders =
    orders.filter(order=>{

        const date =
        new Date(order.date);

        return (
            date.getFullYear() ===
            now.getFullYear()
            &&
            date.getMonth() ===
            now.getMonth()
        );

    });

}
if(keyword){

    orders =
    orders.filter(order=>{

        const text =
        [
            order.customer,
            order.date,
            order.total,
            ...order.items.map(item=>item.name),
            ...order.items.map(item=>item.remark || "")
        ]
        .join(" ")
        .toLowerCase();

        return text.includes(keyword);

    });

}
orders.reverse();

    if(orders.length === 0){
        historyList.innerHTML = "尚無歷史紀錄";
        return;
    }

    orders.forEach(order=>{
        const card = document.createElement("div");
        card.className = "history-card";

        let detailHtml = "";

        order.items.forEach(item=>{
          detailHtml += `
    <div>
        ${item.name}
        ${item.remark ? `(${item.remark})` : ""}
        ${getItemQtyText(item)}
        $${item.amount}
    </div>
`;
        });

        card.innerHTML = `
            <div><strong>${order.customer}</strong></div>
           <div>
${
    new Date(order.date)
    .toLocaleString("zh-TW")
}
</div>
            <div>
    合計 $${order.total}
</div>

<div class="history-actions">

    <button
        onclick="viewHistoryReceipt('${order.id}')">
        👁️查看
    </button>

    <button
        onclick="copyHistoryReceipt('${order.id}')">
        📋重印
    </button>

</div>

<button
    class="delete-history-btn"
    onclick="deleteHistoryOrder('${order.id}')">
    🗑️刪除
</button>

<div class="history-detail">
    ${detailHtml}
</div>
        `;

        card.addEventListener("click",()=>{
            card.querySelector(".history-detail").classList.toggle("show");
        });
let touchStartX = 0;
let touchEndX = 0;

card.addEventListener("touchstart",(event)=>{

    touchStartX =
    event.changedTouches[0].screenX;

});

card.addEventListener("touchend",(event)=>{

    touchEndX =
    event.changedTouches[0].screenX;

    if(touchStartX - touchEndX > 60){

        card.classList.add("swipe-delete");

    }

    if(touchEndX - touchStartX > 60){

        card.classList.remove("swipe-delete");

    }

});
        historyList.appendChild(card);
    });

    let pressTimer;


}

function getItemQtyText(item){

    if(item.priceMode === "weight"){

        if(item.qty){
            return `${item.weight}（${item.qty}${item.unit}）`;
        }

        return item.weight;

    }

    return `${item.qty}${item.unit}`;

}

function buildReceiptText(order){

    let text = "";

    text += "蔬果出貨單\n\n";

    text += `${order.customer}\n`;

    text += `${order.date}\n`;

    text += "--------------------\n";

    order.items.forEach(item=>{

        const remark =
        item.remark
        ? `(${item.remark})`
        : "";

        text +=
        `${item.name}${remark} ${getItemQtyText(item)} $${item.amount}\n`;

    });

    text += "--------------------\n";

    text += `合計：$${order.total}`;

    return text;

}

async function copyHistoryReceipt(id){

    const order =
    historyOrders.find(
        item => String(item.id) === String(id)
    );

    if(!order){

        alert("找不到出貨單");

        return;

    }

    const text =
    buildReceiptText(order);

    await navigator.clipboard
    .writeText(text);

    alert(
        "出貨單已複製\n可直接貼到 Fun Print"
    );

}

function viewHistoryReceipt(id){

    const order =
    historyOrders.find(
        item => String(item.id) === String(id)
    );

    if(!order){

        alert("找不到出貨單");

        return;

    }

    alert(
        buildReceiptText(order)
    );

}

document.getElementById("cancelBtn").addEventListener("click",()=>{
    modal.classList.remove("show");
    editIndex = null;
});

document.getElementById("saveBtn").addEventListener("click",()=>{

    const priceMode =
    priceModeInput.value;

    const qty =
    qtyInput.value;

    const unit =
    unitInput.value;

    const unitPrice =
    unitPriceInput.value;

    const amount =
    amountInput.value;

    const weight =
    formatWeightInput(
        weightInput.value
    );

    const remark =
    remarkInput.value;

    if(priceMode === "fixed"){

        if(!qty || !unitPrice){
            alert("請輸入數量與單價");
            return;
        }

    }

    if(priceMode === "weight"){

        if(!weight || !amount){
            alert("請輸入重量與金額");
            return;
        }

    }

    const itemData = {
        name: currentProduct,
        priceMode,
        qty,
        unit,
        unitPrice,
        weight,
        amount,
        remark
    };

    if(editIndex !== null){
        orderItems[editIndex] = itemData;
        editIndex = null;
    }else{
        orderItems.push(itemData);
    }

    saveRecentProduct(currentProduct);

    modal.classList.remove("show");

    saveCurrentOrder();
    renderOrderList();

});

customerSelect.addEventListener("change",()=>{
    currentCustomer = customerSelect.value;

    localStorage.setItem("currentCustomer", currentCustomer);

    updateCurrentCustomerBox();
});

document.getElementById("addCustomerBtn").addEventListener("click",async ()=>{
    const name = prompt("請輸入客戶名稱");

    if(!name) return;

    const trimmedName = name.trim();

    if(!trimmedName) return;

    if(customerStore.includes(trimmedName)){
        alert("客戶已存在");
        return;
    }

    const success =
    await addCustomerToSupabase(trimmedName);

    if(!success){
        alert("新增失敗");
        return;
    }

    currentCustomer = trimmedName;

    localStorage.setItem(
        "currentCustomer",
        trimmedName
    );

    await initCustomers();

    customerSelect.value = trimmedName;

    renderManageCustomerList();
    updateCurrentCustomerBox();

    alert("客戶新增成功");
});



document.getElementById("checkoutBtn").addEventListener("click",()=>{

    if(orderItems.length === 0){
        alert("尚未加入商品");
        return;
    }

    if(!currentCustomer){
        alert("請先選擇客戶");
        return;
    }

    let total = 0;

    orderItems.forEach(item=>{
        total += parseFloat(item.amount) || 0;
    });

    pendingOrder = {
        id: Date.now(),
        date: new Date().toLocaleString("zh-TW"),
        customer: currentCustomer,
        items: [...orderItems],
        total
    };

    receiptPreview.innerText =
    buildReceiptText(pendingOrder);

    receiptModal.classList.add("show");

});

receiptCancelBtn.addEventListener("click",()=>{

    receiptModal.classList.remove("show");

});

copyReceiptBtn.addEventListener("click",async()=>{

    if(!pendingOrder) return;

    const text =
    buildReceiptText(pendingOrder);

    await navigator.clipboard.writeText(text);

    alert("已複製出貨單，可以貼到 Fun Print");

});

confirmCheckoutBtn.addEventListener("click",async ()=>{

    if(!pendingOrder) return;

    const savedOrder =
    await saveOrderToSupabase(
        pendingOrder
    );

    if(!savedOrder){

        alert("出貨失敗：訂單沒有存成功");

        return;

    }

    const itemsSaved =
    await saveOrderItemsToSupabase(
        savedOrder.id,
        pendingOrder.items
    );

    if(!itemsSaved){

        alert("出貨失敗：商品明細沒有存成功");

        return;

    }

    historyOrders.push(pendingOrder);

    localStorage.setItem(
        "historyOrders",
        JSON.stringify(historyOrders)
    );

    orderItems = [];

    saveCurrentOrder();

    receiptModal.classList.remove("show");

    alert(
        `出貨完成\n\n客戶：${pendingOrder.customer}\n金額：$${pendingOrder.total}`
    );

    pendingOrder = null;

 renderOrderList();

await initHistory();

});





productSearch.addEventListener("input",()=>{

    const keyword =
    productSearch.value.trim().toLowerCase();

    if(keyword === ""){
        const activeBtn =
        document.querySelector(".category-btn.active");

        renderProducts(activeBtn.dataset.category);
        return;
    }

    productGrid.innerHTML = "";

    let allProducts = [];

    Object.values(productStore).forEach(group=>{
        allProducts = allProducts.concat(group);
    });

    const results =
    allProducts.filter(name=>{
        return name.toLowerCase().includes(keyword);
    });

    if(results.length === 0){
        productGrid.innerHTML =
        `<div class="empty-text">找不到商品</div>`;
        return;
    }

    results.forEach(name=>{
        const btn =
        document.createElement("button");

        btn.innerText = name;

        btn.addEventListener("click",()=>{
            addProduct(name);
        });

        productGrid.appendChild(btn);
    });

});

document.querySelectorAll(".category-btn").forEach(button=>{

    button.addEventListener("click",()=>{

        document.querySelectorAll(".category-btn").forEach(btn=>{
            btn.classList.remove("active");
        });

        button.classList.add("active");

        productSearch.value = "";

        renderProducts(button.dataset.category);

    });

});

document
.getElementById(
    "addProductBtn"
)
.addEventListener(
"click",
async ()=>{

    const name =
    document
    .getElementById(
        "newProductName"
    )
    .value
    .trim();

    const category =
    document
    .getElementById(
        "newProductCategory"
    )
    .value;

    if(!name){

        alert("請輸入商品名稱");

        return;

    }

    const success =
    await addProductToSupabase(
        name,
        category
    );

    if(!success){

        alert("新增失敗");

        return;

    }

    await initProducts();

    document
    .getElementById(
        "newProductName"
    )
    .value = "";

    alert("商品新增成功");

});

document
.getElementById(
    "addCustomerManageBtn"
)
.addEventListener(
"click",
async ()=>{

    const name =
    document
    .getElementById(
        "newCustomerName"
    )
    .value
    .trim();

    if(!name){

        alert("請輸入客戶名稱");

        return;

    }

    if(
        customerStore.includes(
            name
        )
    ){

        alert("客戶已存在");

        return;

    }

    const success =
await addCustomerToSupabase(
    name
);

if(!success){

    alert("新增失敗");

    return;

}

    document
    .getElementById(
        "newCustomerName"
    )
    .value = "";

await initCustomers();

renderManageCustomerList();

    alert("客戶新增成功");

});

function exportOrders(filter){

    let orders =
    [...historyOrders];

    const now =
    new Date();

    if(filter === "today"){

        orders =
        orders.filter(order=>{

            const date =
            new Date(order.date);

            return (
                date.toDateString() ===
                now.toDateString()
            );

        });

    }

    if(filter === "month"){

        orders =
        orders.filter(order=>{

            const date =
            new Date(order.date);

            return (
                date.getFullYear() ===
                now.getFullYear()
                &&
                date.getMonth() ===
                now.getMonth()
            );

        });

    }

    if(orders.length === 0){

        alert("沒有資料可匯出");

        return;

    }

    let csv = "\uFEFF";

    csv +=
    "日期,客戶,商品,數量,單位,備註,金額\n";

    orders.forEach(order=>{

        order.items.forEach(item=>{

            csv += [

                order.date,

                order.customer,

                item.name,

                item.qty,

                item.unit,

                item.remark || "",

                item.amount

            ]
            .map(value=>
                `"${String(value).replace(/"/g,'""')}"`
            )
            .join(",");

            csv += "\n";

        });

    });

    const blob =
    new Blob(
        [csv],
        {
            type:
            "text/csv;charset=utf-8;"
        }
    );

    const url =
    URL.createObjectURL(blob);

    const link =
    document.createElement("a");

    link.href = url;

    const today =
    new Date()
    .toISOString()
    .slice(0,10);

    link.download =
    `蔬果出貨紀錄_${filter}_${today}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

}

document
.getElementById(
    "exportAllBtn"
)
.addEventListener(
"click",
()=>{

    exportOrders("all");

});

document
.getElementById(
    "exportTodayBtn"
)
.addEventListener(
"click",
()=>{

    exportOrders("today");

});

document
.getElementById(
    "exportMonthBtn"
)
.addEventListener(
"click",
()=>{

    exportOrders("month");

});

document
.querySelectorAll(
".history-filter-btn"
)
.forEach(btn=>{

    btn.addEventListener(
    "click",
    ()=>{

        document
        .querySelectorAll(
        ".history-filter-btn"
        )
        .forEach(item=>{

            item.classList.remove(
                "active"
            );

        });

        btn.classList.add(
            "active"
        );

        historyFilter =
        btn.dataset.filter;

        renderHistory();

    });

});
if(historySearch){

    historySearch.addEventListener(
        "input",
        ()=>{
            renderHistory();
        }
    );

}
initCustomers();
initProducts();
renderRecentProducts();
renderOrderList();
initHistory();
updateCurrentCustomerBox();

const tabs =
document.querySelectorAll(".tab");

const pages =
document.querySelectorAll(".page");

tabs.forEach(tab=>{

    tab.addEventListener("click",()=>{

        tabs.forEach(btn=>{
            btn.classList.remove("active");
        });

        pages.forEach(page=>{
            page.classList.remove("active-page");
        });

        tab.classList.add("active");

        const targetPage =
        document.getElementById(
            tab.dataset.page
        );

        if(targetPage){
            targetPage.classList.add(
                "active-page"
            );
        }

    });

});