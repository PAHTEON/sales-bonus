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
    const profitCents = seller.profit; // уже в копейках
    let bonusCents = 0;

    if (index === 0) bonusCents = profitCents * 15 / 100;
    else if (index === 1 || index === 2) bonusCents = profitCents * 10 / 100;
    else if (index === total - 1) bonusCents = 0;
    else bonusCents = profitCents * 5 / 100;

    return Math.round(bonusCents);
}


/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    if (!data || !Array.isArray(data.sellers) || !Array.isArray(data.products) || !Array.isArray(data.purchase_records) ||
        data.sellers.length === 0 || data.products.length === 0 || data.purchase_records.length === 0) {
        throw new Error('Некорректные входные данные');
    }
    if (!options || typeof options !== 'object') {
        throw new Error('Некорректные опции');
    }

    const { calculateRevenue, calculateBonus } = options;
    if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('Опции должны содержать функции calculateRevenue и calculateBonus');
    }

    const toCents = (num) => {
        if (typeof num !== 'number' || isNaN(num) || num < 0) {
            throw new Error(`Недопустимое значение для конвертации в копейки: ${num}`);
        }
        return Math.round(num * 100);
    };

    const sellerStats = data.sellers.map(seller => ({
        seller_id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenueCents: 0,
        profitCents: 0,
        sales_count: 0,
        products_sold: {}
    }));

    const sellerIndex = Object.fromEntries(sellerStats.map(s => [s.seller_id, s]));
    const productIndex = Object.fromEntries(data.products.map(p => [p.sku, p]));

    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return;
        seller.sales_count += 1;

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            if (!product) return;

            const revenueCents = toCents(calculateRevenue(item, product));
            const costCents = toCents(product.purchase_price * item.quantity);
            const profitCents = revenueCents - costCents;

            seller.revenueCents += revenueCents;
            seller.profitCents += profitCents;

            seller.products_sold[item.sku] = (seller.products_sold[item.sku] || 0) + item.quantity;
        });
    });

    sellerStats.sort((a, b) => b.profitCents - a.profitCents);
    const totalSellers = sellerStats.length;

    sellerStats.forEach((seller, index) => {
        const bonusCents = calculateBonus(index, totalSellers, {
            ...seller,
            profit: seller.profitCents // передаём в копейках
        });

        seller.bonus = bonusCents / 100;
        seller.revenue = seller.revenueCents / 100;
        seller.profit = seller.profitCents / 100;

        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        delete seller.products_sold;
        delete seller.revenueCents;
        delete seller.profitCents;
    });

    return sellerStats;
}

return {
    calculateSimpleRevenue,
    calculateBonusByProfit,
    analyzeSalesData
};