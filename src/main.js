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
        throw new Error('Invalid options');
    }

    const { calculateRevenue, calculateBonus } = options;

    if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('Invalid options');
    }

    if (!data) throw new Error('Отсутствуют данные');
    if (!data.sellers) throw new Error('Отсутствуют sellers');
    if (!data.products) throw new Error('Отсутствуют products');
    if (!data.purchase_records) throw new Error('Отсутствуют purchase_records');

    const { sellers, products, purchase_records } = data;

    if (!sellers.length) throw new Error('Пустой список sellers');
    if (!products.length) throw new Error('Пустой список products');
    if (!purchase_records.length) throw new Error('Пустой список purchase_records');

    const productMap = {};
    products.forEach(p => productMap[p.id] = p);

    const sellerStats = sellers.map(seller => ({
        seller_id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        bonus: 0,
        sales_count: 0,
        top_products: []
    }));

    const sellerMap = {};
    sellerStats.forEach(s => sellerMap[s.seller_id] = s);

    for (const record of purchase_records) {
        const seller = sellerMap[record.seller_id];
        seller.sales_count += 1; // ✔ один чек

        for (const item of record.items) {
            const product = productMap[item.product_id];

            const revenue = Number(
                calculateRevenue(item, product).toFixed(2)
            );

            const profit = Number(
                (revenue * product.profit_margin / 100).toFixed(2)
            );

            seller.revenue += revenue;
            seller.profit += profit;

            const existing = seller.top_products.find(
                p => p.sku === product.sku
            );

            if (existing) {
                existing.quantity += item.quantity;
            } else {
                seller.top_products.push({
                    sku: product.sku,
                    quantity: item.quantity
                });
            }
        }
    }

    sellerStats.forEach(seller => {
        seller.revenue = Number(seller.revenue.toFixed(2));
        seller.profit = Number(seller.profit.toFixed(2));

        seller.top_products
            .sort((a, b) => b.quantity - a.quantity)
            .splice(10);
    });

    sellerStats.sort((a, b) => b.profit - a.profit);

    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller);
    });

    return sellerStats;
}

return {
    calculateSimpleRevenue,
    calculateBonusByProfit,
    analyzeSalesData
};