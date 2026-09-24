const STORAGE_KEY = "kasa-excel-v2";

const START_BANK = 20000;
const TARGET_LOW = 150000;
const TARGET_HIGH = 200000;

let data;

try {
    data =
        JSON.parse(localStorage.getItem(STORAGE_KEY)) ||
        {
            start: START_BANK,
            entries: []
        };
} catch (e) {
    data = {
        start: START_BANK,
        entries: []
    };
}

let selectedResult = "KAZANDI";

const $ = id =>
    document.getElementById(id);


/* =========================================
   PARA FORMATLAMA
   ========================================= */

function money(value) {

    return new Intl.NumberFormat(
        "tr-TR",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(value) + " TL";
}


/* =========================================
   GÜNCEL KASA
   ========================================= */

function currentBank() {

    if (data.entries.length === 0) {
        return data.start;
    }

    return data.entries[
        data.entries.length - 1
    ].endBank;
}


/* =========================================
   KAYDET
   ========================================= */

function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );
}


/* =========================================
   TÜM KAYITLARI YENİDEN HESAPLA
   =========================================

   Örneğin 2. günün riskini/oranını
   değiştirirsek 2. günden sonraki
   bütün kasalar yeniden hesaplanır.
   ========================================= */

function recalculateAll() {

    let runningBank = data.start;

    data.entries.forEach(
        (item, index) => {

            const risk =
                Number(item.risk);

            const odds =
                Number(item.odds);

            const stake =
                runningBank *
                risk /
                100;

            let profitLoss;

            if (
                item.result ===
                "KAZANDI"
            ) {

                profitLoss =
                    stake *
                    (odds - 1);

            } else {

                profitLoss =
                    -stake;
            }

            const endBank =
                runningBank +
                profitLoss;


            item.day =
                index + 1;

            item.startBank =
                runningBank;

            item.stake =
                stake;

            item.profitLoss =
                profitLoss;

            item.endBank =
                endBank;


            runningBank =
                endBank;
        }
    );

    saveData();
}


/* =========================================
   YENİ GÜN ÖN İZLEME
   ========================================= */

function calculatePreview() {

    const startBank =
        currentBank();

    const risk =
        parseFloat(
            $("risk").value
        ) || 0;

    const odds =
        parseFloat(
            $("odds").value
        );

    const stake =
        startBank *
        risk /
        100;


    $("stake").textContent =
        money(stake);


    if (
        !Number.isFinite(odds) ||
        odds <= 1
    ) {

        $("preview").textContent =
            "Oranı girince tahmini gün sonu burada görünecek.";

        return;
    }


    let profitLoss;

    if (
        selectedResult ===
        "KAZANDI"
    ) {

        profitLoss =
            stake *
            (odds - 1);

    } else {

        profitLoss =
            -stake;
    }


    const endBank =
        startBank +
        profitLoss;


    if (
        selectedResult ===
        "KAZANDI"
    ) {

        $("preview").textContent =
            "Tahmini net kâr: " +
            money(profitLoss) +
            " • Gün sonu: " +
            money(endBank);

    } else {

        $("preview").textContent =
            "Tahmini fire: " +
            money(stake) +
            " • Gün sonu: " +
            money(endBank);
    }
}


/* =========================================
   TABLOYU EKRANA BAS
   ========================================= */

function render() {

    const bank =
        currentBank();

    const totalProfitLoss =
        bank -
        data.start;


    const winningEntries =
        data.entries.filter(
            item =>
                item.result ===
                "KAZANDI"
        );


    const fireEntries =
        data.entries.filter(
            item =>
                item.result ===
                "FİRE"
        );


    const totalFire =
        fireEntries.reduce(
            (total, item) =>
                total +
                item.stake,
            0
        );


    $("currentBank").textContent =
        money(bank);


    if (
        totalProfitLoss >= 0
    ) {

        $("totalPL").textContent =
            "Toplam Kâr/Zarar: +" +
            money(
                totalProfitLoss
            );

    } else {

        $("totalPL").textContent =
            "Toplam Kâr/Zarar: -" +
            money(
                Math.abs(
                    totalProfitLoss
                )
            );
    }


    $("winDays").textContent =
        winningEntries.length;


    $("lossDays").textContent =
        fireEntries.length;


    $("totalFire").textContent =
        money(totalFire);


    $("toLow").textContent =
        money(
            Math.max(
                0,
                TARGET_LOW -
                bank
            )
        );


    $("toHigh").textContent =
        money(
            Math.max(
                0,
                TARGET_HIGH -
                bank
            )
        );


    const history =
        $("history");


    history.innerHTML =
        data.entries
        .map(
            (item, index) => {

                const resultClass =
                    item.result ===
                    "KAZANDI"
                        ? "win"
                        : "fire";


                const profitClass =
                    item.profitLoss >= 0
                        ? "pos"
                        : "neg";


                const profitText =
                    item.profitLoss >= 0
                        ? "+" +
                          money(
                              item.profitLoss
                          )
                        : "-" +
                          money(
                              Math.abs(
                                  item.profitLoss
                              )
                          );


                return `

                <tr>

                    <td>
                        ${item.day}
                    </td>


                    <td>
                        ${money(
                            item.startBank
                        )}
                    </td>


                    <!-- RİSK DÜZENLENEBİLİR -->

                    <td>

                        <input
                            class="table-input risk-edit"
                            type="number"
                            min="0.01"
                            max="100"
                            step="0.01"
                            value="${item.risk}"
                            data-index="${index}">

                    </td>


                    <td>
                        ${money(
                            item.stake
                        )}
                    </td>


                    <!-- ORAN DÜZENLENEBİLİR -->

                    <td>

                        <input
                            class="table-input odds-edit"
                            type="number"
                            min="1.01"
                            step="0.01"
                            value="${item.odds}"
                            data-index="${index}">

                    </td>


                    <!-- SONUÇ -->

                    <td>

                        <button
                            type="button"
                            class="table-result ${resultClass}"
                            data-index="${index}">

                            ${item.result}

                        </button>

                    </td>


                    <!-- KÂR / ZARAR -->

                    <td
                        class="${profitClass}">

                        ${profitText}

                    </td>


                    <!-- GÜN SONU -->

                    <td>

                        <b>
                            ${money(
                                item.endBank
                            )}
                        </b>

                    </td>


                    <!-- SİL -->

                    <td>

                        <button
                            type="button"
                            class="delete-row"
                            data-index="${index}"
                            title="Kaydı Sil">

                            🗑️

                        </button>

                    </td>

                </tr>

                `;
            }
        )
        .join("");


    $("empty").style.display =
        data.entries.length
            ? "none"
            : "block";


    addTableEvents();

    calculatePreview();
}


/* =========================================
   TABLO İÇİ DÜZENLEME OLAYLARI
   ========================================= */

function addTableEvents() {


    /* -------------------------
       RİSK DEĞİŞTİR
       ------------------------- */

    document
    .querySelectorAll(
        ".risk-edit"
    )
    .forEach(input => {

        input.addEventListener(
            "change",
            function () {

                const index =
                    Number(
                        this.dataset.index
                    );

                const value =
                    parseFloat(
                        this.value
                    );


                if (
                    !Number.isFinite(value) ||
                    value <= 0 ||
                    value > 100
                ) {

                    alert(
                        "Risk % 0 ile 100 arasında olmalıdır."
                    );

                    render();

                    return;
                }


                data.entries[
                    index
                ].risk =
                    value;


                recalculateAll();

                render();
            }
        );
    });


    /* -------------------------
       ORAN DEĞİŞTİR
       ------------------------- */

    document
    .querySelectorAll(
        ".odds-edit"
    )
    .forEach(input => {

        input.addEventListener(
            "change",
            function () {

                const index =
                    Number(
                        this.dataset.index
                    );

                const value =
                    parseFloat(
                        this.value
                    );


                if (
                    !Number.isFinite(value) ||
                    value <= 1
                ) {

                    alert(
                        "Geçerli bir oran gir."
                    );

                    render();

                    return;
                }


                data.entries[
                    index
                ].odds =
                    value;


                recalculateAll();

                render();
            }
        );
    });


    /* -------------------------
       KAZANDI / FİRE DEĞİŞTİR
       ------------------------- */

    document
    .querySelectorAll(
        ".table-result"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const index =
                    Number(
                        this.dataset.index
                    );


                if (
                    data.entries[
                        index
                    ].result ===
                    "KAZANDI"
                ) {

                    data.entries[
                        index
                    ].result =
                        "FİRE";

                } else {

                    data.entries[
                        index
                    ].result =
                        "KAZANDI";
                }


                recalculateAll();

                render();
            }
        );
    });


    /* -------------------------
       TEK KAYIT SİL
       ------------------------- */

    document
    .querySelectorAll(
        ".delete-row"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const index =
                    Number(
                        this.dataset.index
                    );


                const day =
                    data.entries[
                        index
                    ].day;


                const approved =
                    confirm(
                        day +
                        ". gün kaydı silinsin mi?"
                    );


                if (!approved) {
                    return;
                }


                data.entries.splice(
                    index,
                    1
                );


                /*
                   Bir kayıt silinince
                   kalan tüm günler ve
                   kasa zinciri yeniden
                   hesaplanır.
                */

                recalculateAll();

                render();
            }
        );
    });
}


/* =========================================
   YENİ GÜN RİSK / ORAN
   ========================================= */

$("risk").addEventListener(
    "input",
    calculatePreview
);


$("odds").addEventListener(
    "input",
    calculatePreview
);


/* =========================================
   YENİ GÜN SONUÇ SEÇİMİ
   ========================================= */

document
.querySelectorAll(
    ".choice"
)
.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            selectedResult =
                button.dataset.result;


            document
            .querySelectorAll(
                ".choice"
            )
            .forEach(item => {

                item.classList.remove(
                    "active"
                );

            });


            button.classList.add(
                "active"
            );


            calculatePreview();
        }
    );
});


/* =========================================
   YENİ GÜN KAYDET
   ========================================= */

$("save").addEventListener(
    "click",
    () => {

        const risk =
            parseFloat(
                $("risk").value
            );


        const odds =
            parseFloat(
                $("odds").value
            );


        if (
            !Number.isFinite(risk) ||
            risk <= 0 ||
            risk > 100
        ) {

            alert(
                "Risk % 0 ile 100 arasında olmalıdır."
            );

            return;
        }


        if (
            !Number.isFinite(odds) ||
            odds <= 1
        ) {

            alert(
                "Geçerli bir oran gir."
            );

            return;
        }


        const startBank =
            currentBank();


        const stake =
            startBank *
            risk /
            100;


        let profitLoss;


        if (
            selectedResult ===
            "KAZANDI"
        ) {

            profitLoss =
                stake *
                (odds - 1);

        } else {

            profitLoss =
                -stake;
        }


        const endBank =
            startBank +
            profitLoss;


        data.entries.push({

            day:
                data.entries.length +
                1,

            startBank:
                startBank,

            risk:
                risk,

            stake:
                stake,

            odds:
                odds,

            result:
                selectedResult,

            profitLoss:
                profitLoss,

            endBank:
                endBank

        });


        saveData();


        /*
           Yeni gün eklendikten sonra
           oran alanını temizliyoruz.
           Risk yüzdesi aynı kalıyor.
        */

        $("odds").value =
            "";


        render();
    }
);


/* =========================================
   TÜM KAYITLARI SİL
   ========================================= */

$("reset").addEventListener(
    "click",
    () => {

        const approved =
            confirm(
                "Tüm günlük kayıtlar silinsin ve kasa 20.000 TL'ye dönsün mü?"
            );


        if (!approved) {
            return;
        }


        data = {

            start:
                START_BANK,

            entries:
                []
        };


        saveData();

        render();
    }
);


/* =========================================
   UYGULAMA AÇILIŞI
   ========================================= */

/*
   Eski kayıtlar varsa yeni sisteme
   göre bir kez yeniden hesaplanır.
*/

recalculateAll();

render();
