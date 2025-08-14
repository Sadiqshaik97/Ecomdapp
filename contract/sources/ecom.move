module 0x8ba7ccb4867e780b823883b9ef3ec994d6f675e40f3d9e94b0d1f99875e587d9::sadiq_addr {
    use std::string::String;
    use std::string;
    use std::table::{Self, Table};
    use aptos_framework::account;
    use std::signer;

    struct Product has key, store, drop, copy {
        name: String,
        price: u64,
        stock: u64,
    }

    struct ShopOwner has key {
        products: Table<String, Product>,
        next_order_id: u64,
    }

    struct Order has store {
        customer: address,
        product_name: String,
        price_paid: u64,
        order_id: u64,
    }

    struct CustomerOrders has key {
        orders: Table<u64, Order>,
        order_count: u64,
    }

    fun init_module(owner: &signer) {
        move_to(owner, ShopOwner {
            products: table::new(),
            next_order_id: 0,
        });
    }

    public entry fun create_product(owner: &signer, name: String, price: u64, stock: u64) acquires ShopOwner {
    let shop_owner = borrow_global_mut<ShopOwner>(signer::address_of(owner));
    let product = Product { name: copy name, price, stock };
    table::add(&mut shop_owner.products, name, product);
    }

    public entry fun update_product_price(owner: &signer, name: String, new_price: u64) acquires ShopOwner {
    let shop_owner = borrow_global_mut<ShopOwner>(signer::address_of(owner));
        let product = table::borrow_mut(&mut shop_owner.products, name);
        product.price = new_price;
    }

    public entry fun update_product_stock(owner: &signer, name: String, new_stock: u64) acquires ShopOwner {
    let shop_owner = borrow_global_mut<ShopOwner>(signer::address_of(owner));
        let product = table::borrow_mut(&mut shop_owner.products, name);
        product.stock = new_stock;
    }

    public entry fun delete_product(owner: &signer, name: String) acquires ShopOwner {
    let shop_owner = borrow_global_mut<ShopOwner>(signer::address_of(owner));
        table::remove(&mut shop_owner.products, name);
    }

    public entry fun buy_product(customer: &signer, shop_owner_addr: address, name: String) acquires ShopOwner, CustomerOrders {
        let shop_owner = borrow_global_mut<ShopOwner>(shop_owner_addr);
    let product = table::borrow_mut(&mut shop_owner.products, copy name);
        
        assert!(product.stock > 0, 0);

        let order_id = shop_owner.next_order_id;
        shop_owner.next_order_id = order_id + 1;
        product.stock = product.stock - 1;

        let order = Order {
            customer: signer::address_of(customer),
            product_name: copy name,
            price_paid: product.price,
            order_id,
        };

        if (!exists<CustomerOrders>(signer::address_of(customer))) {
            move_to(customer, CustomerOrders { orders: table::new(), order_count: 0 });
        };
        let customer_orders = borrow_global_mut<CustomerOrders>(signer::address_of(customer));
        table::add(&mut customer_orders.orders, order_id, order);
        customer_orders.order_count = customer_orders.order_count + 1;
    }

    public fun get_product_details(shop_owner_addr: address, name: String): (String, u64, u64) acquires ShopOwner {
    let shop_owner = borrow_global<ShopOwner>(shop_owner_addr);
    let product = table::borrow(&shop_owner.products, name);
    let Product { name, price, stock } = *product;
    (name, price, stock)
    }

    public fun get_product_stock(shop_owner_addr: address, name: String): u64 acquires ShopOwner {
        let shop_owner = borrow_global<ShopOwner>(shop_owner_addr);
        let product = table::borrow(&shop_owner.products, name);
        product.stock
    }

    public fun get_customer_order_count(customer_addr: address): u64 acquires CustomerOrders {
        let orders = borrow_global<CustomerOrders>(customer_addr);
        orders.order_count
    }

    public fun get_customer_order_details(customer_addr: address, order_id: u64): (address, String, u64, u64) acquires CustomerOrders {
        let orders = borrow_global<CustomerOrders>(customer_addr);
        let order = table::borrow(&orders.orders, order_id);
    (order.customer, order.product_name, order.price_paid, order.order_id)
    }
}
