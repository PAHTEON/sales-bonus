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
function analyzeSalesData(options) {
    if (!options || typeof options !== 'object') {
        throw new Error('Некорректные опции');
    }

    const { sellers, products, purchase_records } = options;

    if (!purchase_records) throw new Error('Отсутствуют данные о продажах');
    if (!sellers) throw new Error('Отсутствуют продавцы');
    if (!products) throw new Error('Отсутствуют товары');

    if (!sellers.length) throw new Error('Пустой список продавцов');
    if (!products.length) throw new Error('Пустой список товаров');
    if (!purchase_records.length) throw new Error('Пустой список продаж');

    const sellerStats = sellers.map(seller => ({
        seller_id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        bonus: 0,
        sales_count: 0,
        top_products: []
    }));

    const productMap = {};
    products.forEach(p => {
        productMap[p.id] = p;
    });

    const sellerMap = {};
    sellerStats.forEach(s => {
        sellerMap[s.seller_id] = s;
    });

    for (const record of purchase_records) {
        const seller = sellerMap[record.seller_id];

        for (const item of record.items) {
            const product = productMap[item.product_id];

            // 🔴 ВАЖНО: округляем КАЖДУЮ покупку
            const revenue = Number(
                calculateSimpleRevenue(item, product).toFixed(2)
            );

            const profit = Number(
                (revenue * product.profit_margin).toFixed(2)
            );

            seller.revenue += revenue;
            seller.profit += profit;
            seller.sales_count += item.quantity;

            const topProduct = seller.top_products.find(
                p => p.product_id === item.product_id
            );

            if (topProduct) {
                topProduct.quantity += item.quantity;
            } else {
                seller.top_products.push({
                    product_id: item.product_id,
                    quantity: item.quantity
                });
            }
        }
    }

    sellerStats.forEach(seller => {
        seller.revenue = Number(seller.revenue.toFixed(2));
        seller.profit = Number(seller.profit.toFixed(2));

        seller.top_products.sort((a, b) => b.quantity - a.quantity);
        seller.top_products = seller.top_products.slice(0, 10);
    });

    sellerStats.sort((a, b) => b.profit - a.profit);

    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonusByProfit(
            index,
            sellerStats.length,
            seller
        );
    });

    return sellerStats;
}

return {
    calculateSimpleRevenue,
    calculateBonusByProfit,
    analyzeSalesData
};