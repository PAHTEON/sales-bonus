/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) { //не менять параметры
    // @TODO: Расчет выручки от операции
    const quantity = Number(purchase.quantity) || 0;
    const salePrice = Number(purchase.sale_price) || 0;
    const discount = Number(purchase.discount) || 0;

    const revenue = salePrice * quantity * (1 - discount / 100);
    return +revenue.toFixed(2);
}

/**
 * Функция для расчета бонусов
 * @param {number} index порядковый номер в отсортированном массиве
 * @param {number} total общее число продавцов
 * @param {Object} seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) { //не менять параметры
    // @TODO: Расчет бонуса от позиции в рейтинге
    const profit = seller.profit || 0;

    if (index === 0) return +(profit * 0.15).toFixed(2);
    if (index === 1 || index === 2) return +(profit * 0.10).toFixed(2);
    if (index === total - 1) return 0;
    return +(profit * 0.05).toFixed(2);
}


/**
 * Функция для анализа данных продаж
 * @param {Object} data
 * @param {Object} options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) { //не менять параметры
    // @TODO: Проверка входных данных
    if (!data ||
        !Array.isArray(data.sellers) || data.sellers.length === 0 ||
        !Array.isArray(data.products) || data.products.length === 0 ||
        !Array.isArray(data.purchase_records) || data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }

    if (!options || typeof options !== 'object') {
        throw new Error('Не передан объект опций');
    }

    const { calculateRevenue, calculateBonus } = options;
    if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('Не переданы функции для расчёта выручки или бонуса');
    }



    // @TODO: Проверка наличия опций
    // @TODO: Подготовка промежуточных данных для сбора статистики

    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));


    // @TODO: Индексация продавцов и товаров для быстрого доступа

    const sellerIndex = Object.fromEntries(sellerStats.map(s => [s.id, s]));
    const productIndex = Object.fromEntries(data.products.map(p => [p.sku, p]));


    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return;
        seller.sales_count += 1;
        seller.revenue += record.total_amount - record.total_discount;

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            if (!product) return;

            const revenue = calculateRevenue(item, product);
            const cost = product.purchase_price * item.quantity;
            seller.profit += revenue - cost;

            if (!seller.products_sold[item.sku]) seller.products_sold[item.sku] = 0;
            seller.products_sold[item.sku] += item.quantity;
        });
    });


    // @TODO: Расчет выручки и прибыли для каждого продавца

    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования
    sconst totalSellers = sellerStats.length;
    sellerStats.forEach((seller, index) => {
        seller.bonus = +calculateBonus(index, totalSellers, seller).toFixed(2);

        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
        seller.revenue = +seller.revenue.toFixed(2);
        seller.profit = +seller.profit.toFixed(2);
    });
    // @TODO: Подготовка итоговой коллекции с нужными полями

    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: seller.revenue,
        profit: seller.profit,
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: seller.bonus
    }));
}