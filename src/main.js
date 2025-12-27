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
    // Проверка входных данных
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

    // Проверка опций
    if (!options || typeof options !== 'object') {
        throw new Error('Некорректные опции');
    }
    const { calculateRevenue, calculateBonus } = options;
    if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('Чего-то не хватает в опциях');
    }

    // Подготовка промежуточных данных
    const sellerStats = data.sellers.map(seller => ({
        seller_id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenueCents: 0, // считаем в копейках
        profitCents: 0, // считаем в копейках
        sales_count: 0,
        products_sold: {}
    }));

    // Индексация продавцов и товаров
    const sellerIndex = Object.fromEntries(sellerStats.map(seller => [seller.seller_id, seller]));
    const productIndex = Object.fromEntries(data.products.map(product => [product.sku, product]));

    // Перебор всех чеков
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return;

        // Увеличиваем количество продаж
        seller.sales_count += 1;

        // Проходим по всем товарам в чеке
        record.items.forEach(item => {
            const product = productIndex[item.sku];
            if (!product) return;

            // Рассчёт выручки и прибыли
            const revenue = calculateRevenue(item, product); // выручка в рублях
            const cost = product.purchase_price * item.quantity; // себестоимость

            // Округляем до копеек отдельно для точности расчетов
            const revenueCents = Math.round(revenue * 100);
            const costCents = Math.round(cost * 100);
            const profitCents = revenueCents - costCents;

            // Увеличиваем накопленные суммы в копейках
            seller.revenueCents += revenueCents;
            seller.profitCents += profitCents;

            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profitCents - a.profitCents);

    // Назначение бонусов и формирование топ-10 товаров
    sellerStats.forEach((seller, index) => {
        // Округляем и сохраняем финальные значения
        seller.revenue = +(seller.revenueCents / 100).toFixed(2);
        seller.profit = +(seller.profitCents / 100).toFixed(2);

        // Бонус
        seller.bonus = Number(calculateBonus(index, sellerStats.length, seller).toFixed(2));

        // Топ-10 товаров
        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        // Удаляем промежуточные поля
        delete seller.revenueCents;
        delete seller.profitCents;
        delete seller.products_sold;
    });

    return sellerStats;
}

return {
    calculateSimpleRevenue,
    calculateBonusByProfit,
    analyzeSalesData
};