$(document).ready(function() {
    // Játék állapota
    let gameState = {
        score: 0,
        money: 100,
        round: 1,
        targetScore: 100,
        hand: [],
        jokers: [],
        upgrades: [],
        shopItems: [],
        selectedCards: [],
        difficulty: 1,
        theme: 'dark',
        musicEnabled: true,
        remainingHands: 4,
        swapsRemaining: 3
    };

    let handSubmitted = false;

            // Kártyák és jokerek inicializálása
            const suits = ['♠', '♥', '♦', '♣'];
            const suitNames = { '♠': 'spade', '♥': 'heart', '♦': 'diamond', '♣': 'club' };
            const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
            const valueOrder = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
            const jokers = [
                { name: 'Extra Pont', effect: 'addScore', value: 10 },
                { name: 'Pénz Szorzó', effect: 'addMoney', value: 20 }
            ];
            const upgrades = [
                { name: 'Erő +1', effect: 'addScore', value: 5 },
                { name: 'Pénz +10', effect: 'addMoney', value: 10 }
            ];

            // Effektusok kezelése
            function applyEffect(effect, value) {
                if (effect === 'addScore') {
                    gameState.score += value;
                } else if (effect === 'addMoney') {
                    gameState.money += value;
                }
            }

    // Célpontszám kiszámítása a nehézségi szint alapján
    function calculateTargetScore(baseScore, difficulty) {
        return baseScore * difficulty;
    }

    // LocalStorage betöltése és állapot ellenőrzése
    if (localStorage.getItem('balatroGameState')) {
        gameState = JSON.parse(localStorage.getItem('balatroGameState'));
        $('#difficulty').val(gameState.difficulty);
        $('#theme').val(gameState.theme);
        $('#music-toggle').prop('checked', gameState.musicEnabled);
        gameState.targetScore = calculateTargetScore(100 * gameState.round, gameState.difficulty);
        applyTheme(gameState.theme);
        updateUI();
    } else {
        gameState.targetScore = calculateTargetScore(100, gameState.difficulty);
        applyTheme(gameState.theme);
        updateUI();
    }

            // Háttérzene kezelése
            const bgMusic = document.getElementById('background-music');
            bgMusic.volume = 0.4;
            function toggleMusic() {
                if (gameState.musicEnabled) {
                    bgMusic.play().catch(() => {
                        console.log('Autoplay blocked, requires user interaction');
                    });
                } else {
                    bgMusic.pause();
                }
            }
            toggleMusic();

            // Téma alkalmazása
            function applyTheme(theme) {
                $('body').css('background-color', theme === 'dark' ? '#1a1a1a' : '#f0f0f0');
                $('#game-container').css('background-color', theme === 'dark' ? '#2a2a2a' : '#e0e0e0');
            }

            // Új kéz generálása (cserék levonása nélkül)
            function generateHandNew() {
                gameState.hand = [];
                for (let i = 0; i < 8; i++) {
                    const suit = suits[Math.floor(Math.random() * suits.length)];
                    const value = values[Math.floor(Math.random() * values.length)];
                    gameState.hand.push({ suit, value });
                }
                renderHand();
                updateUI();
                localStorage.setItem('balatroGameState', JSON.stringify(gameState));
            }

            // Kéz generálása cserelevonással
            function generateHand() {
                if (gameState.swapsRemaining > 0) {
                    gameState.hand = [];
                    for (let i = 0; i < 8; i++) {
                        const suit = suits[Math.floor(Math.random() * suits.length)];
                        const value = values[Math.floor(Math.random() * values.length)];
                        gameState.hand.push({ suit, value });
                    }
                    gameState.swapsRemaining--;
                    renderHand();
                    updateUI();
                    localStorage.setItem('balatroGameState', JSON.stringify(gameState));
                }
            }

            // Bolt generálása
            function generateShop() {
                gameState.shopItems = [];
                for (let i = 0; i < 3; i++) {
                    if (Math.random() < 0.5) {
                        const suit = suits[Math.floor(Math.random() * suits.length)];
                        const value = values[Math.floor(Math.random() * values.length)];
                        gameState.shopItems.push({ type: 'card', suit, value, price: 10 });
                    } else if (Math.random() < 0.75) {
                        const joker = jokers[Math.floor(Math.random() * jokers.length)];
                        gameState.shopItems.push({ type: 'joker', name: joker.name, effect: joker.effect, value: joker.value, price: 20 });
                    } else {
                        const upgrade = upgrades[Math.floor(Math.random() * upgrades.length)];
                        gameState.shopItems.push({ type: 'upgrade', name: upgrade.name, effect: upgrade.effect, value: upgrade.value, price: 15 });
                    }
                }
                renderShop();
                updateUI();
                localStorage.setItem('balatroGameState', JSON.stringify(gameState));
            }

            // UI frissítése
            function updateUI() {
                $('#score').text(`Pontszám: ${gameState.score}`);
                $('#money').text(`Pénz: ${gameState.money} $`);
                $('#round').text(`Kör: ${gameState.round}/3`);
                $('#target-score').text(`Cél pontszám: ${gameState.targetScore}`);
                $('#remaining-hands').text(`Hátralévő kezek: ${gameState.remainingHands}`);
                $('#swaps-remaining').text(`Hátralévő cserék: ${gameState.swapsRemaining}`);
                renderHand();
                renderJokers();
                renderUpgrades();
                renderShop();
            }

            // Kéz renderelése
            function renderHand() {
                $('#hand').empty();
                gameState.hand.forEach((card, index) => {
                    const suitClass = suitNames[card.suit];
                    const cardDiv = $(`
                        <div class="card ${suitClass}">
                            <div class="value">${card.value}</div>
                            <div class="suit">${card.suit}</div>
                        </div>
                    `);
                    cardDiv.data('index', index);
                    cardDiv.draggable({
                        revert: true,
                        start: function() {
                            $(this).addClass('selected');
                        },
                        stop: function() {
                            $(this).removeClass('selected');
                        }
                    });
                    cardDiv.click(function() {
                        toggleCardSelection(index);
                    });
                    $('#hand').append(cardDiv);
                });
            }

            // Jokerek renderelése
            function renderJokers() {
                $('#jokers').empty();
                gameState.jokers.forEach(joker => {
                    const jokerDiv = $(`<div class="joker"><div class="name">${joker.name}</div></div>`);
                    $('#jokers').append(jokerDiv);
                });
            }

            // Erősítések renderelése
            function renderUpgrades() {
                $('#upgrades').empty();
                gameState.upgrades.forEach(upgrade => {
                    const upgradeDiv = $(`<div class="upgrade"><div class="name">${upgrade.name}</div></div>`);
                    $('#upgrades').append(upgradeDiv);
                });
            }

            // Bolt renderelése
            function renderShop() {
                $('#shop').empty();
                gameState.shopItems.forEach((item, index) => {
                    let itemDiv;
                    if (item.type === 'card') {
                        const suitClass = suitNames[item.suit];
                        itemDiv = $(`
                            <div class="card ${suitClass}">
                                <div class="value">${item.value}</div>
                                <div class="suit">${item.suit}</div>
                                <div class="price">${item.price}$</div>
                            </div>
                        `);
                    } else if (item.type === 'joker') {
                        itemDiv = $(`
                            <div class="joker">
                                <div class="name">${item.name}</div>
                                <div class="price">${item.price}$</div>
                            </div>
                        `);
                    } else {
                        itemDiv = $(`
                            <div class="upgrade">
                                <div class="name">${item.name}</div>
                                <div class="price">${item.price}$</div>
                            </div>
                        `);
                    }
                    itemDiv.click(function() {
                        buyItem(index);
                    });
                    $('#shop').append(itemDiv);
                });
            }

            // Kártya kiválasztása
            function toggleCardSelection(index) {
                const clickSound = document.getElementById('click-sound');
                clickSound.volume = 0.1;
                clickSound.play();
                const cardIndex = gameState.selectedCards.indexOf(index);
                if (cardIndex === -1 && gameState.selectedCards.length < 5) {
                    gameState.selectedCards.push(index);
                } else if (cardIndex !== -1) {
                    gameState.selectedCards.splice(cardIndex, 1);
                }
                renderHand();
                gameState.selectedCards.forEach(i => {
                    $(`#hand .card:eq(${i})`).addClass('selected');
                });
            }

            // Kéz leadása
            $('#submit-hand').click(function() {
                if (gameState.selectedCards.length > 0 && gameState.remainingHands > 0) {
                    gameState.remainingHands--;
                    const handScore = evaluateHand();
                    gameState.score += handScore;
                    gameState.jokers.forEach(joker => {
                        applyEffect(joker.effect, joker.value);
                    });
                    gameState.upgrades.forEach(upgrade => {
                        applyEffect(upgrade.effect, upgrade.value);
                    });
                    checkRound();
                    handSubmitted = true;
                    gameState.selectedCards = [];
                    generateHandNew();
                    updateUI();
                    localStorage.setItem('balatroGameState', JSON.stringify(gameState));
                } else if (gameState.remainingHands === 0) {
                    checkRound(); // Ha az utolsó kéz, ellenőrizzük, hogy teljesült-e a cél
                    if (gameState.round <= 3 ) {
                        alert('Elfogyott a kezed! A kör befejezéséhez el kell érned a célpontszámot.');
                        if (gameState.score < gameState.targetScore) {
                            resetGame();
                        }
                    }
                }
            });

            // Kéz csere
            $('#swap-hand').click(function() {
                if (gameState.swapsRemaining > 0) {
                    generateHand(); // Csak a "Kéz csere" gomb csökkenti a cseréket
                } else {
                    alert("Nincs már több cseréd!")
                }
            });

            // Kéz értékelése
            function evaluateHand() {
                const selectedCards = gameState.selectedCards.map(i => gameState.hand[i]);
                const values = selectedCards.map(card => card.value);
                const suits = selectedCards.map(card => card.suit);

                const counts = {};
                values.forEach(v => counts[v] = (counts[v] || 0) + 1);
                const valueCounts = Object.values(counts);
                if (valueCounts.includes(4)) return 100;

                const numericValues = selectedCards.map(card => valueOrder[card.value]);
                numericValues.sort((a, b) => a - b);
                let isSequence = true;
                for (let i = 1; i < numericValues.length; i++) {
                    if (numericValues[i] !== numericValues[i - 1] + 1) {
                        isSequence = false;
                        break;
                    }
                }
                if (isSequence && numericValues.length === 5) return 100;

                const suitCounts = {};
                suits.forEach(s => suitCounts[s] = (suitCounts[s] || 0) + 1);
                if (Object.values(suitCounts).includes(5)) return 100;

                const pairs = valueCounts.filter(count => count >= 2).length;
                if (pairs === 2) return 40;

                if (valueCounts.includes(3)) return 50;

                if (valueCounts.includes(2)) return 20;

                return 10;
            }

    // Kör ellenőrzése
    function checkRound() {
        if (gameState.score >= gameState.targetScore) {
            gameState.round++;
            gameState.score = 0;
            gameState.money += 45;
            gameState.remainingHands = 4;
            gameState.swapsRemaining = 3;
            // Új kör célpontszámának kiszámítása az aktuális nehézségi szint alapján
            gameState.targetScore = calculateTargetScore(100 * gameState.round, gameState.difficulty);
            if (gameState.round > 3) {
                alert('Gratulálunk, legyőzted a végső főgonoszt!');
                resetGame();
            } else {
                alert(`Kör ${gameState.round - 1} teljesítve! +45 pénz`);
            }
        }
    }

            // Vásárlás
            function buyItem(index) {
                const item = gameState.shopItems[index];
                if (gameState.money >= item.price) {
                    gameState.money -= item.price;
                    if (item.type === 'card') {
                        gameState.hand.push({ suit: item.suit, value: item.value });
                    } else if (item.type === 'joker') {
                        gameState.jokers.push({ name: item.name, effect: item.effect, value: item.value });
                    } else {
                        gameState.upgrades.push({ name: item.name, effect: item.effect, value: item.value });
                    }
                    generateShop();
                    updateUI();
                    localStorage.setItem('balatroGameState', JSON.stringify(gameState));
                } else {
                    alert('Nincs elég pénzed!');
                }
            }

            // Bolt gomb
            $('#buy-button').click(function() {
                if (gameState.money >= 10) {
                    gameState.money -= 10
                    generateShop();
                    updateUI();
                } else {
                    alert("Nincs elég pénzed, hogy újra sorsold a boltot.")
                }
            });

    // Konfigurációs menü
    $('#config-button').click(function() {
        $('#config-menu').dialog({
            modal: true,
            width: 400,
            title: 'Beállítások',
            open: function() {
                if (handSubmitted) {
                    $('#difficulty').prop('disabled', true); // Csúszka tiltása, ha már leadtak kezet
                } else {
                    $('#difficulty').prop('disabled', false); // Csúszka engedélyezése, ha még nem leadtak kezet
                }
            },
            buttons: {
                "Mentés": function() {
                    gameState.difficulty = parseInt($('#difficulty').val());
                    gameState.theme = $('#theme').val();
                    gameState.musicEnabled = $('#music-toggle').prop('checked');
                    gameState.targetScore = calculateTargetScore(100 * gameState.round, gameState.difficulty);
                    applyTheme(gameState.theme);
                    toggleMusic();
                    updateUI();
                    $(this).dialog('close');
                    localStorage.setItem('balatroGameState', JSON.stringify(gameState));
                }
            }
        });
    });

            // Súgó menü
            $('#help-button').click(function() {
                $('#help-menu').dialog({
                    modal: true,
                    width: 400,
                    title: 'Súgó',
                    buttons: {
                        "Bezárás": function() {
                            $(this).dialog('close');
                        }
                    }
                });
            });

            // Billentyűzet események
            $(document).keydown(function(e) {
                if (e.key === 'Enter') $('#submit-hand').click();
                if (e.key === ' ') $('#buy-button').click();
            });

    // Időzített animáció (bolt frissítése)
    setInterval(function() {
        const speedFactor = 1000; // Alapértelmezett sebesség, mivel a difficulty most mást jelent
        $('.shop-item').animate({ opacity: 0.5 }, speedFactor).animate({ opacity: 1 }, speedFactor);
    }, 5000);

    // Játék visszaállítása
    function resetGame() {
        const difficulty = $('#difficulty').val();
        const theme = $('#theme').val();
        const musicEnabled = $('#music-toggle').prop('checked');

        gameState = {
            score: 0,
            money: 100,
            round: 1,
            targetScore: 100,
            hand: [],
            jokers: [],
            upgrades: [],
            shopItems: [],
            selectedCards: [],
            difficulty: parseInt(difficulty),
            theme: theme,
            musicEnabled: musicEnabled,
            remainingHands: 4,
            swapsRemaining: 3
        };
        handSubmitted = false;
        gameState.targetScore = calculateTargetScore(100, gameState.difficulty);
        localStorage.setItem('balatroGameState', JSON.stringify(gameState));
        applyTheme(theme);
        generateHandNew();
        generateShop();
        updateUI();
        toggleMusic();
    }

            // Kezdeti inicializálás
            if (!gameState.hand.length && !gameState.shopItems.length) {
                generateHandNew();
                generateShop();
            }
            updateUI();
        });