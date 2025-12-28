/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) { //не менять параметры
    const discountMultiplier = 1 - (purchase.discount / 100);
    return purchase.sale_price * purchase.quantity * discountMultiplier;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) { //не менять параметры
    // @TODO: Расчет бонуса от позиции в рейтинге
    const profit = seller.profit;
    let bonus = 0;

    if (index === 0) bonus = profit * 0.15;
    else if (index === 1 || index === 2) bonus = profit * 0.10;
    else if (index === total - 1) bonus = 0;
    else bonus = profit * 0.05;

    return Math.round(bonus * 100) / 100;
}


/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    if (!options || typeof options !== 'object') {
        throw new Error('Некорректные опции');
    }

    const { calculateRevenue, calculateBonus } = options;
    if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('Некорректные опции');
    }

    if (!data ||
        !Array.isArray(data.sellers) ||
        !Array.isArray(data.products) ||
        !Array.isArray(data.purchase_records) ||
        data.sellers.length === 0 ||
        data.products.length === 0 ||
        data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }

    // Индекс товаров по id
    const productMap = {};
    data.products.forEach(p => {
        productMap[p.id] = p;
    });

    const sellerStats = data.sellers.map(seller => ({
        seller_id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    const sellerMap = {};
    sellerStats.forEach(s => {
        sellerMap[s.seller_id] = s;
    });

    // Перебор чеков
    for (const record of data.purchase_records) {
        const seller = sellerMap[record.seller_id];
        if (!seller) continue;

        seller.sales_count += 1;

        seller.revenue += record.total_amount - record.total_discount;

        for (const item of record.items) {
            const product = productMap[item.product_id];
            if (!product) continue;

            const revenueItem = calculateRevenue(item, product);
            const cost = product.purchase_price * item.quantity;

            seller.profit += revenueItem - cost;

            seller.products_sold[product.sku] =
                (seller.products_sold[product.sku] || 0) + item.quantity;
        }
    }

    // Сортировка по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);

    // Финализация
    sellerStats.forEach((seller, index) => {
        seller.revenue = Number(seller.revenue.toFixed(2));
        seller.profit = Number(seller.profit.toFixed(2));

        seller.bonus = calculateBonus(index, sellerStats.length, seller);

        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        delete seller.products_sold;
    });

    return sellerStats;
}