#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Añade a la CLÁUSULA 13 de los T&C los dos puntos nuevos, en los 6 idiomas:
#   g) Reproducciones (máx. 3 por video)
#   h) Ritmo de avance (cupo de temas nuevos por día + solicitud de cupo extra)
# Lo hace como una página de continuación anexada a cada PDF de public/, con
# candado anti-duplicado (idempotente). Footer con admin@catecumen.com.
#
# Nota: para de/fr/pt/it, el generador maestro es _archivo/build_clausulas_4idiomas.py;
# si algún día se regenera desde ahí, vuelve a correr este script para re-anexar g/h
# (o incorpora el texto inline en ese generador).
import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph
from reportlab.lib.enums import TA_JUSTIFY
from pypdf import PdfReader, PdfWriter

LOGO = "info/catecumenlogoaurea.jpg"
H1 = ParagraphStyle("H1", fontName="Helvetica-Bold", fontSize=15, leading=19,
                    textColor=colors.HexColor("#111111"), spaceAfter=4)
SUB = ParagraphStyle("SUB", fontName="Helvetica-Bold", fontSize=12, leading=16,
                     textColor=colors.HexColor("#111111"), spaceBefore=8, spaceAfter=6)
BODY = ParagraphStyle("BODY", fontName="Helvetica", fontSize=10, leading=15,
                      alignment=TA_JUSTIFY, textColor=colors.HexColor("#1a1a1a"), spaceAfter=8)

def header_footer(canvas, doc):
    canvas.saveState()
    try:
        from reportlab.lib.utils import ImageReader
        img = ImageReader(LOGO); iw, ih = img.getSize()
        w = 3.4*cm; h = w*ih/iw
        canvas.drawImage(img, A4[0]-doc.rightMargin-w, A4[1]-1.4*cm-h, width=w, height=h, mask='auto')
    except Exception:
        pass
    canvas.setStrokeColor(colors.HexColor("#cccccc")); canvas.setLineWidth(0.6)
    canvas.line(doc.leftMargin, 1.6*cm, A4[0]-doc.rightMargin, 1.6*cm)
    canvas.setFont("Helvetica", 8.5)
    canvas.setFillColor(colors.HexColor("#1a4bd8")); canvas.drawCentredString(A4[0]/2-30, 1.15*cm, "www.catecumen.com")
    canvas.setFillColor(colors.HexColor("#333333")); canvas.drawString(A4[0]/2+52, 1.15*cm, "/ admin@catecumen.com")
    canvas.restoreState()

def build_page(story, buf):
    doc = BaseDocTemplate(buf, pagesize=A4, leftMargin=2.2*cm, rightMargin=2.2*cm,
                          topMargin=3.2*cm, bottomMargin=2.2*cm)
    frame = Frame(doc.leftMargin, doc.bottomMargin, A4[0]-doc.leftMargin-doc.rightMargin,
                  A4[1]-doc.topMargin-doc.bottomMargin, id='f')
    doc.addPageTemplates([PageTemplate(id='m', frames=[frame], onPage=header_footer)])
    doc.build(story)

# (pdf, H1, SUB, g, h, marcador-guard)
DOCS = [
("public/normatividad_catecumen.pdf",
 "TÉRMINOS Y CONDICIONES DE USO — ACTUALIZACIÓN",
 "13. Acceso a los Contenidos Audiovisuales (continuación)",
 "<b>g) Reproducciones.</b> Cada video admite un máximo de <b>3 (tres) reproducciones</b>. Alcanzado ese número, el acceso se cierra aunque no hayan transcurrido las 72 horas; para volver a verlo, el Usuario deberá solicitar una nueva apertura, que la administración podrá aprobar o denegar a su criterio.",
 "<b>h) Ritmo de avance.</b> Para preservar el proceso formativo, la plataforma puede limitar el número de temas nuevos que el Usuario inicia por día (de forma orientativa, 2 temas diarios), sin que el cupo no utilizado se acumule. El Usuario podrá solicitar cupo adicional para un día determinado, cuya concesión queda a criterio de la administración.",
 "Ritmo de avance"),
("public/norms_catecumen_en.pdf",
 "TERMS AND CONDITIONS OF USE — UPDATE",
 "13. Access to Audiovisual Content (continued)",
 "<b>g) Plays.</b> Each video allows a maximum of <b>3 (three) plays</b>. Once that number is reached, access closes even if the 72 hours have not elapsed; to watch it again, the User must request a new opening, which the administration may approve or deny at its discretion.",
 "<b>h) Progress pace.</b> To preserve the formative process, the platform may limit the number of new topics the User starts per day (indicatively, 2 per day), with any unused allowance not carrying over. The User may request additional allowance for a given day, granted at the administration's discretion.",
 "Progress pace"),
("public/norms_catecumen_fr.pdf",
 "CONDITIONS GÉNÉRALES D'UTILISATION — MISE À JOUR",
 "13. Accès aux contenus audiovisuels (suite)",
 "<b>g) Lectures.</b> Chaque vidéo autorise au maximum <b>3 lectures</b>. Une fois ce nombre atteint, l'accès se ferme même si les 72 heures ne se sont pas écoulées ; pour la revoir, l'Utilisateur doit demander une nouvelle ouverture, que l'administration peut accorder ou refuser à sa discrétion.",
 "<b>h) Rythme de progression.</b> Afin de préserver le processus de formation, la plateforme peut limiter le nombre de nouveaux thèmes commencés par jour (à titre indicatif, 2 par jour), sans report du quota non utilisé. L'Utilisateur peut demander un quota supplémentaire pour une journée donnée, accordé à la discrétion de l'administration.",
 "Rythme de progression"),
("public/norms_catecumen_de.pdf",
 "ALLGEMEINE GESCHÄFTSBEDINGUNGEN — AKTUALISIERUNG",
 "13. Zugang zu audiovisuellen Inhalten (Fortsetzung)",
 "<b>g) Wiedergaben.</b> Jedes Video erlaubt höchstens <b>3 Wiedergaben</b>. Nach Erreichen dieser Zahl wird der Zugriff geschlossen, auch wenn die 72 Stunden noch nicht abgelaufen sind; um es erneut anzusehen, muss der Nutzer eine neue Öffnung beantragen, die die Verwaltung nach eigenem Ermessen genehmigen oder ablehnen kann.",
 "<b>h) Lerntempo.</b> Zur Wahrung des Bildungsprozesses kann die Plattform die Anzahl neuer Themen begrenzen, die der Nutzer pro Tag beginnt (richtwertweise 2 pro Tag), wobei ein nicht genutztes Kontingent nicht übertragen wird. Der Nutzer kann für einen bestimmten Tag ein zusätzliches Kontingent beantragen, dessen Gewährung im Ermessen der Verwaltung liegt.",
 "Lerntempo"),
("public/norms_catecumen_pt.pdf",
 "TERMOS E CONDIÇÕES DE USO — ATUALIZAÇÃO",
 "13. Acesso aos conteúdos audiovisuais (continuação)",
 "<b>g) Reproduções.</b> Cada vídeo admite um máximo de <b>3 reproduções</b>. Atingido esse número, o acesso é encerrado mesmo que não tenham decorrido as 72 horas; para o ver novamente, o Utilizador deverá solicitar uma nova abertura, que a administração poderá aprovar ou recusar a seu critério.",
 "<b>h) Ritmo de avanço.</b> Para preservar o processo formativo, a plataforma pode limitar o número de temas novos que o Utilizador inicia por dia (a título indicativo, 2 por dia), sem que a cota não utilizada se acumule. O Utilizador poderá solicitar cota adicional para um dia determinado, cuja concessão fica a critério da administração.",
 "Ritmo de avanço"),
("public/norms_catecumen_it.pdf",
 "TERMINI E CONDIZIONI D'USO — AGGIORNAMENTO",
 "13. Accesso ai contenuti audiovisivi (continuazione)",
 "<b>g) Riproduzioni.</b> Ogni video consente al massimo <b>3 riproduzioni</b>. Raggiunto tale numero, l'accesso si chiude anche se non sono trascorse le 72 ore; per rivederlo, l'Utente dovrà richiedere una nuova apertura, che l'amministrazione potrà approvare o negare a propria discrezione.",
 "<b>h) Ritmo di avanzamento.</b> Per preservare il processo formativo, la piattaforma può limitare il numero di nuovi temi che l'Utente inizia al giorno (a titolo indicativo, 2 al giorno), senza che la quota non utilizzata si accumuli. L'Utente può richiedere una quota aggiuntiva per una determinata giornata, concessa a discrezione dell'amministrazione.",
 "Ritmo di avanzamento"),
]

for pdf, h1, sub, g, h, marker in DOCS:
    try:
        base = PdfReader(pdf)
    except Exception as e:
        print(f"{pdf}: no se pudo abrir ({e})"); continue
    tail = "".join((p.extract_text() or "") for p in base.pages[-3:])
    if marker in tail:
        print(f"{pdf}: ya tiene g/h — no se modifica."); continue
    buf = io.BytesIO()
    build_page([Paragraph(h1, H1), Paragraph(sub, SUB), Paragraph(g, BODY), Paragraph(h, BODY)], buf)
    buf.seek(0)
    add = PdfReader(buf)
    w = PdfWriter()
    for p in base.pages: w.add_page(p)
    for p in add.pages: w.add_page(p)
    with open(pdf, "wb") as f: w.write(f)
    print(f"{pdf}: {len(base.pages)} + {len(add.pages)} páginas")
print("OK — cláusula 13 g/h en 6 idiomas")
