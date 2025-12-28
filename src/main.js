/**
 * Функция для расчета выручки по одной записи о покупке
 * @param purchase запись о покупке (содержит sale_price, quantity, discount)
 * @param _product карточка товара (не используется в расчете, но оставлен для совместимости)
 * @returns {number} выручка за эту покупку
 */
function calculateSimpleRevenue(purchase, _product) {
    // Деструктуризация полей покупки
    const { discount, sale_price, quantity } = purchase;

    // Множитель для скидки (например, 10% скидка => multiplier = 0.9)
    const discountMultiplier = 1 - (discount / 100);

    // Вычисляем выручку с учетом количества и скидки
    const revenue = sale_price * quantity * discountMultiplier;

    return revenue;
}

/**
 * Функция для расчета бонуса продавца по его позиции в рейтинге
 * @param index порядковый номер продавца в отсортированном массиве (по прибыли)
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number} сумма бонуса
 */
function calculateBonusByProfit(index, total, seller) {
    const profit = seller.profit;
    let percent = 0;

    // Устанавливаем процент бонуса в зависимости от позиции
    if (index === 0) {
        percent = 0.15; // 1-е место — 15% от прибыли
    } else if (index === 1 || index === 2) {
        percent = 0.1; // 2-е и 3-е место — 10% от прибыли
    } else if (index === total - 1) {
        percent = 0; // Последнее место — бонуса нет
    } else {
        percent = 0.05; // Все остальные — 5% от прибыли
    }

    return profit * percent;
}

/**
 * Функция для анализа всех данных продаж
 * @param data объект с массивами sellers, products и purchase_records
 * @param options объект с функциями calculateRevenue и calculateBonus
 * @returns массив статистики по каждому продавцу
 */
function analyzeSalesData(data, options) {
    const { calculateRevenue, calculateBonus } = options;

    // Проверка корректности входных данных
    if (!data ||
        !Array.isArray(data.sellers) ||
        !Array.isArray(data.products) ||
        !Array.isArray(data.purchase_records) ||
        data.sellers.length === 0 ||
        data.products.length === 0 ||
        data.purchase_records.length === 0
    ) {
        throw new Error("Некорректные входные данные");
    }

    // Инициализация статистики продавцов
    const sellerStats = data.sellers.map((seller) => ({
        id: seller.id, // ID продавца
        name: `${seller.first_name} ${seller.last_name}`, // Полное имя
        revenue: 0, // Выручка
        profit: 0, // Прибыль
        sales_count: 0, // Количество продаж
        products_sold: {}, // Проданные товары с количеством по SKU
    }));

    // Создаем индекс для быстрого поиска продавца по ID
    const sellerIndex = Object.fromEntries(
        sellerStats.map((seller) => [seller.id, seller])
    );

    // Создаем индекс товаров по SKU для быстрого доступа
    const productIndex = Object.fromEntries(
        data.products.map((product) => [product.sku, product])
    );

    // Обрабатываем все записи о покупках
    data.purchase_records.forEach((record) => {
        const seller = sellerIndex[record.seller_id]; // Находим продавца по ID
        if (!seller) return;

        seller.sales_count++; // Увеличиваем количество продаж

        // Обрабатываем каждый товар в покупке
        record.items.forEach((item) => {
            const product = productIndex[item.sku]; // Находим карточку товара
            if (!product) return;

            const revenue = calculateRevenue(item, product); // Выручка за товар
            const cost = product.purchase_price * item.quantity; // Себестоимость
            const profitItem = revenue - cost; // Прибыль за товар

            // Суммируем выручку и прибыль
            seller.revenue += +revenue.toFixed(2);
            seller.profit += profitItem;

            // Учитываем количество проданных единиц по SKU
            seller.products_sold[item.sku] =
                (seller.products_sold[item.sku] || 0) + item.quantity;
        });
    });

    // Сортировка продавцов по убыванию прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);

    // Вычисляем бонусы и формируем топ-10 товаров по количеству
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller);

        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity) // Сортировка по убыванию количества
            .slice(0, 10); // Берем только топ-10
    });

    // Приводим статистику к финальному формату для возврата
    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }));
}