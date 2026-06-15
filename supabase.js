const SUPABASE_URL =
"https://nxuhoyehuglsaneprcdt.supabase.co";

const SUPABASE_KEY =
"sb_publishable_bW1XfGHyJnpC7lBkXecU8w_MUv1Qv-m";

const supabaseClient =
supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log(
    "Supabase已連線",
    supabaseClient
);

async function loadCustomersFromSupabase(){

    const { data, error } =
    await supabaseClient
    .from("customers")
    .select("*")
    .order("name");

    if(error){

        console.error(
            "讀取客戶失敗",
            error
        );

        return [];

    }

    return data;

}



async function addCustomerToSupabase(name){

    const { data, error } =
    await supabaseClient
    .from("customers")
    .insert([
        {
            name: name
        }
    ])
    .select();

    console.log(
        "新增結果",
        data,
        error
    );

    if(error){

        console.error(
            "新增客戶失敗",
            error
        );

        return false;

    }

    return true;

}

async function updateCustomerInSupabase(
    oldName,
    newName
){

    const { data, error } =
    await supabaseClient
    .from("customers")
    .update({
        name: newName
    })
    .eq(
        "name",
        oldName
    )
    .select();

    console.log(
        "修改結果",
        data,
        error
    );

    if(error){

        console.error(
            "修改客戶失敗",
            error
        );

        return false;

    }

    return true;

}

async function loadProductsFromSupabase(){

    const { data, error } =
    await supabaseClient
    .from("products")
    .select("*")
    .order("category")
    .order("name");

    if(error){

        console.error(
            "讀取商品失敗",
            error
        );

        return [];

    }

    return data;

}

async function addProductToSupabase(
    name,
    category
){

    const { data, error } =
    await supabaseClient
    .from("products")
    .insert([
        {
            name:name,
            category:category
        }
    ])
    .select();

    console.log(
        "商品新增結果",
        data,
        error
    );

    if(error){

        console.error(
            "新增商品失敗",
            error
        );

        return false;

    }

    return true;

}

async function updateProductInSupabase(
    category,
    oldName,
    newName
){

    const { data, error } =
    await supabaseClient
    .from("products")
    .update({
        name: newName
    })
    .eq("category", category)
    .eq("name", oldName)
    .select();

    console.log(
        "商品修改結果",
        data,
        error
    );

    if(error){

        console.error(
            "修改商品失敗",
            error
        );

        return false;

    }

    return true;

}



async function saveOrderToSupabase(order){

    const orderDate =
    new Date()
    .toISOString()
    .slice(0,10);

    const { data, error } =
    await supabaseClient
    .from("orders")
    .insert([
        {
            customer_name: order.customer,
            total: order.total,
            order_date: orderDate
        }
    ])
    .select()
    .single();

    console.log(
        "訂單新增結果",
        data,
        error
    );

    if(error){

        console.error(
            "新增訂單失敗",
            error
        );

        return null;

    }

    return data;

}

async function saveOrderItemsToSupabase(
    orderId,
    items
){

    const rows =
    items.map(item=>{

        return {
            order_id: orderId,
            product_name: item.name,
            qty: Number(item.qty),
            unit: item.unit,
            amount: Number(item.amount),
            remark: item.remark || ""
        };

    });

    const { data, error } =
    await supabaseClient
    .from("order_items")
    .insert(rows)
    .select();

    console.log(
        "訂單明細新增結果",
        data,
        error
    );

    if(error){

        console.error(
            "新增訂單明細失敗",
            error
        );

        return false;

    }

    return true;

}

async function loadOrdersFromSupabase(){

    const { data: orders, error: orderError } =
    await supabaseClient
    .from("orders")
    .select("*")
    .order("created_at", {
        ascending:false
    });

    if(orderError){

        console.error(
            "讀取訂單失敗",
            orderError
        );

        return [];

    }

    const { data: items, error: itemError } =
    await supabaseClient
    .from("order_items")
    .select("*");

    if(itemError){

        console.error(
            "讀取訂單明細失敗",
            itemError
        );

        return [];

    }

    const result =
    orders.map(order=>{

        const orderItems =
        items
        .filter(item=>
            item.order_id === order.id
        )
        .map(item=>{

            return {
                name:item.product_name,
                qty:item.qty,
                unit:item.unit,
                amount:item.amount,
                remark:item.remark
            };

        });

        return {
            id:order.id,
            customer:order.customer_name,
          date:order.created_at,
            total:order.total,
            items:orderItems
        };

    });

    return result;

}

async function deleteOrderFromSupabase(orderId){

    const { error: itemError } =
    await supabaseClient
    .from("order_items")
    .delete()
    .eq("order_id", orderId);

    if(itemError){

        console.error(
            "刪除訂單明細失敗",
            itemError
        );

        return false;

    }

    const { error: orderError } =
    await supabaseClient
    .from("orders")
    .delete()
    .eq("id", orderId);

    if(orderError){

        console.error(
            "刪除訂單失敗",
            orderError
        );

        return false;

    }

    return true;

}

async function deleteProductFromSupabase(category,name){

    const { error } =
    await supabaseClient
    .from("products")
    .delete()
    .eq("category", category)
    .eq("name", name);

    console.log(
        "商品刪除結果",
        error
    );

    if(error){
        console.error("刪除商品失敗", error);
        return false;
    }

    return true;
}

async function deleteCustomerFromSupabase(name){

    const { error } =
    await supabaseClient
    .from("customers")
    .delete()
    .eq("name", name);

    console.log("客戶刪除結果", error);

    if(error){
        console.error("刪除客戶失敗", error);
        return false;
    }

    return true;
}