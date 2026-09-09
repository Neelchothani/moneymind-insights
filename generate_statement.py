import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.pdfgen import canvas

def create_bank_statement(filename):
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter  # 612, 792

    # 3 Months of transactions designed to trigger all behavioural models
    transactions = [
        # --- Month 1: June 2026 (Starting Balance: ₹4,850.00) ---
        ("01-06-2026", "ACH CR - TECHSOLUTIONS PVT LTD SALARY", "CMS928104", "", "20,000.00 Cr", "24,850.00"),
        ("02-06-2026", "UPI/415289/Netflix/netflix@paytm/Subscription", "UPI019284", "199.00 Dr", "", "24,651.00"),
        ("03-06-2026", "BBPS/MSEB Electricity Board Power Bill", "BBPS82910", "810.00 Dr", "", "23,841.00"),
        ("04-06-2026", "UPI/415982/Spotify/spotify@icici/Music", "UPI019285", "119.00 Dr", "", "23,722.00"),
        ("05-06-2026", "ACH DR - JIO FIBER BROADBAND BILL", "ACH029102", "599.00 Dr", "", "23,123.00"),
        ("06-06-2026", "POS 491029 RELIANCE FRESH MUMBAI GROCERY", "POS991204", "1,280.00 Dr", "", "21,843.00"),
        ("07-06-2026", "UPI/416102/Swiggy/swiggy@axis/Dinner Delivery", "UPI019286", "340.00 Dr", "", "21,503.00"),
        ("10-06-2026", "UPI/416492/Uber/uber@axis/Cab Trip", "UPI019287", "220.00 Dr", "", "21,283.00"),
        ("12-06-2026", "ACH DR - GYM MEMBERSHIP MONTHLY", "ACH029103", "550.00 Dr", "", "20,733.00"),
        ("14-06-2026", "UPI/416901/Zomato/zomato@hdfc/Lunch Order", "UPI019288", "290.00 Dr", "", "20,443.00"),
        ("17-06-2026", "POS 892019 INDIAN OIL PETROL FUEL", "POS991240", "350.00 Dr", "", "20,093.00"),
        ("19-06-2026", "POS 491030 DMART SUPERMARKET PROVISIONS", "POS991255", "1,100.00 Dr", "", "18,993.00"),
        ("21-06-2026", "UPI/417204/BookMyShow/bms@icici/Movie Ticket", "UPI019289", "450.00 Dr", "", "18,543.00"),
        ("24-06-2026", "ATM CASH WDL - KOTAK ATM ANDHERI", "ATM029100", "800.00 Dr", "", "17,743.00"),
        ("28-06-2026", "UPI/417902/Amazon/amazon@apl/Shopping Order", "UPI019291", "750.00 Dr", "", "16,993.00"),
        
        # --- Month 2: July 2026 ---
        ("01-07-2026", "ACH CR - TECHSOLUTIONS PVT LTD SALARY", "CMS928105", "", "20,000.00 Cr", "36,993.00"),
        ("02-07-2026", "UPI/418289/Netflix/netflix@paytm/Subscription", "UPI019384", "199.00 Dr", "", "36,794.00"),
        ("03-07-2026", "BBPS/MSEB Electricity Board Power Bill", "BBPS82910", "790.00 Dr", "", "36,004.00"),
        ("04-07-2026", "UPI/418982/Spotify/spotify@icici/Music", "UPI019385", "119.00 Dr", "", "35,885.00"),
        ("05-07-2026", "ACH DR - JIO FIBER BROADBAND BILL", "ACH029202", "599.00 Dr", "", "35,286.00"),
        ("06-07-2026", "POS 491040 BIGBASKET GROCERY ORDER", "POS991280", "1,350.00 Dr", "", "33,936.00"),
        ("08-07-2026", "UPI/419012/Swiggy/swiggy@axis/Food Delivery", "UPI019386", "380.00 Dr", "", "33,556.00"),
        ("11-07-2026", "UPI/419201/Ola/ola@icici/Cab Travel", "UPI019387", "240.00 Dr", "", "33,316.00"),
        ("14-07-2026", "UPI/419400/Zomato/zomato@hdfc/Food Order", "UPI019389", "420.00 Dr", "", "32,896.00"),
        ("16-07-2026", "POS 892022 INDIAN OIL PETROL FUEL", "POS991299", "400.00 Dr", "", "32,496.00"),
        ("18-07-2026", "UPI/419610/Flipkart/flipkart@axis/Shopping", "UPI019390", "1,200.00 Dr", "", "31,296.00"),
        ("21-07-2026", "POS 491045 BLINKIT GROCERY DELIVERY", "POS991310", "950.00 Dr", "", "30,346.00"),
        ("24-07-2026", "UPI/419800/Swiggy/swiggy@axis/Dinner Delivery", "UPI019391", "460.00 Dr", "", "29,886.00"),
        ("27-07-2026", "POS 892040 PVR CINEMAS ENTERTAINMENT", "POS991325", "500.00 Dr", "", "29,386.00"),
        ("30-07-2026", "UPI/419950/Apollo Pharmacy/apollo@icici", "UPI019393", "430.00 Dr", "", "28,956.00"),

        # --- Month 3: August 2026 (Food delivery spike & Shopping spike) ---
        ("01-08-2026", "ACH CR - TECHSOLUTIONS PVT LTD SALARY", "CMS928106", "", "20,000.00 Cr", "48,956.00"),
        ("02-08-2026", "UPI/420289/Netflix/netflix@paytm/Subscription", "UPI019484", "199.00 Dr", "", "48,757.00"),
        ("03-08-2026", "BBPS/MSEB Electricity Board Power Bill", "BBPS82910", "820.00 Dr", "", "47,937.00"),
        ("04-08-2026", "UPI/420982/Spotify/spotify@icici/Music", "UPI019485", "119.00 Dr", "", "47,818.00"),
        ("05-08-2026", "ACH DR - JIO FIBER BROADBAND BILL", "ACH029302", "599.00 Dr", "", "47,219.00"),
        ("06-08-2026", "POS 491055 RELIANCE FRESH GROCERY", "POS991350", "1,420.00 Dr", "", "45,799.00"),
        ("07-08-2026", "UPI/421102/Swiggy/swiggy@axis/Late Night Food", "UPI019486", "480.00 Dr", "", "45,319.00"),
        ("09-08-2026", "UPI/421290/Zomato/zomato@hdfc/Weekend Lunch", "UPI019487", "540.00 Dr", "", "44,779.00"),
        ("11-08-2026", "UPI/421450/Uber/uber@axis/Cab Trip", "UPI019488", "280.00 Dr", "", "44,499.00"),
        ("13-08-2026", "UPI/421600/Swiggy/swiggy@axis/Dinner Delivery", "UPI019490", "460.00 Dr", "", "44,039.00"),
        ("15-08-2026", "UPI/421750/Myntra/myntra@kotak/Fashion Order", "UPI019491", "1,890.00 Dr", "", "42,149.00"),
        ("17-08-2026", "POS 892055 INDIAN OIL PETROL FUEL", "POS991370", "450.00 Dr", "", "41,699.00"),
        ("19-08-2026", "POS 491060 ZEPTO GROCERY VEGETABLES", "POS991385", "880.00 Dr", "", "40,819.00"),
        ("21-08-2026", "UPI/422100/Dominos Pizza/dominos@icici", "UPI019493", "620.00 Dr", "", "40,199.00"),
        ("23-08-2026", "UPI/422300/Swiggy/swiggy@axis/Late Dinner", "UPI019494", "510.00 Dr", "", "39,689.00"),
        ("25-08-2026", "UPI/422500/Coursera/coursera@citi/Course Fee", "UPI019495", "1,499.00 Dr", "", "38,190.00"),
        ("27-08-2026", "UPI/422700/Zomato/zomato@hdfc/Snack Order", "UPI019496", "390.00 Dr", "", "37,800.00"),
        ("29-08-2026", "UPI/422900/Amazon/amazon@apl/Home Shopping", "UPI019498", "1,350.00 Dr", "", "36,450.00"),
    ]

    def draw_header(page_num, total_pages):
        c.setFillColor(colors.HexColor("#0f172a"))  # dark navy
        c.rect(0, height - 70, width, 70, fill=True, stroke=False)
        
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 15)
        c.drawString(36, height - 38, "GLOBAL TRUST BANK — STATEMENT OF ACCOUNT")
        
        c.setFont("Helvetica", 8)
        c.drawString(36, height - 54, "Customer: Arjun Mehta  |  A/C: 50100492819284  |  IFSC: GTBK0000128  |  Branch: Mumbai")
        c.drawRightString(width - 36, height - 54, f"Page {page_num} of {total_pages}")

        # Account details box
        c.setFillColor(colors.HexColor("#f8fafc"))
        c.setStrokeColor(colors.HexColor("#cbd5e1"))
        c.rect(36, height - 120, width - 72, 40, fill=True, stroke=True)
        
        c.setFillColor(colors.HexColor("#334155"))
        c.setFont("Helvetica-Bold", 8)
        c.drawString(46, height - 95, "Statement Period:")
        c.drawString(180, height - 95, "Currency:")
        c.drawString(280, height - 95, "Opening Balance:")
        c.drawString(420, height - 95, "Closing Balance:")
        
        c.setFont("Helvetica", 8)
        c.drawString(46, height - 110, "01-Jun-2026 to 31-Aug-2026")
        c.drawString(180, height - 110, "INR (Rs.)")
        c.drawString(280, height - 110, "Rs. 4,850.00")
        c.drawString(420, height - 110, "Rs. 36,450.00")

        # Table Header
        y_table_header = height - 145
        c.setFillColor(colors.HexColor("#1e293b"))
        c.rect(36, y_table_header, width - 72, 20, fill=True, stroke=False)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(42, y_table_header + 6, "Date")
        c.drawString(102, y_table_header + 6, "Narration / Description")
        c.drawString(335, y_table_header + 6, "Ref / Chq")
        c.drawRightString(440, y_table_header + 6, "Withdrawal (Dr)")
        c.drawRightString(515, y_table_header + 6, "Deposit (Cr)")
        c.drawRightString(568, y_table_header + 6, "Balance")

    rows_per_page = 26
    total_pages = (len(transactions) + rows_per_page - 1) // rows_per_page
    
    current_row = 0
    for page in range(1, total_pages + 1):
        draw_header(page, total_pages)
        y = height - 160
        
        c.setFont("Helvetica", 8)
        page_txs = transactions[current_row : current_row + rows_per_page]
        
        for idx, (dt, narr, ref, dr, cr, bal) in enumerate(page_txs):
            if idx % 2 == 1:
                c.setFillColor(colors.HexColor("#f8fafc"))
                c.rect(36, y - 4, width - 72, 14, fill=True, stroke=False)
            
            c.setFillColor(colors.HexColor("#0f172a"))
            c.drawString(42, y, dt)
            c.drawString(102, y, narr[:44])
            c.drawString(335, y, ref)
            
            if dr:
                c.setFillColor(colors.HexColor("#dc2626"))  # red for debit
                c.drawRightString(440, y, dr)
            if cr:
                c.setFillColor(colors.HexColor("#16a34a"))  # green for credit
                c.drawRightString(515, y, cr)
                
            c.setFillColor(colors.HexColor("#0f172a"))
            c.drawRightString(568, y, bal)
            y -= 16
            
        current_row += len(page_txs)
        
        # Footer
        c.setFillColor(colors.HexColor("#64748b"))
        c.setFont("Helvetica", 7)
        c.drawString(36, 25, "This is a computer-generated bank statement for demonstration and financial intelligence testing.")
        c.drawRightString(width - 36, 25, "Confidential — Generated for Moneymind")
        
        c.showPage()

    c.save()
    print(f"Generated {filename} with {len(transactions)} transactions successfully.")

if __name__ == "__main__":
    os.makedirs("public", exist_ok=True)
    create_bank_statement("sample_bank_statement.pdf")
    create_bank_statement("public/sample_bank_statement.pdf")
