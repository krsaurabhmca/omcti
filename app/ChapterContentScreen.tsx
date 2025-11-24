import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

const { width, height } = Dimensions.get("window");

const ChapterContentScreen = () => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [chapterTitle, setChapterTitle] = useState("Chapter Content");

  const { chapter_id, chapter_name } = useLocalSearchParams();

  useEffect(() => {
    if (chapter_id) {
      fetchChapterContent();
    }
  }, [chapter_id]);

  const fetchChapterContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://omcti.in/apprise/api.php?task=get_chapter",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chapter_id: parseInt(chapter_id),
          }),
        }
      );

      const data = await response.text(); // Get as text since it's HTML

      if (data && data.trim() !== "") {
        // Clean and process the HTML content
        const cleanedContent = cleanHtmlContent(data);
        setContent(cleanedContent);
      } else {
        Alert.alert("No Content", "No content found for this chapter");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to fetch chapter content. Please try again."
      );
      console.error("Error fetching chapter content:", error);
    } finally {
      setLoading(false);
    }
  };

  const cleanHtmlContent = (htmlContent) => {
    // Remove error divs and unwanted elements
    let cleaned = htmlContent.replace(
      /<div class="alert alert-error">.*?<\/div>/g,
      ""
    );
    cleaned = cleaned.replace(/<pre>.*?<\/pre>/gs, "");

    // Extract content from blockquote if present
    const blockquoteMatch = cleaned.match(
      /<blockquote[^>]*>(.*?)<\/blockquote>/s
    );
    if (blockquoteMatch) {
      cleaned = blockquoteMatch[1];
    }

    // Add CSS for better formatting with #ffeb44 and #234785 theme
    const styledHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            padding: 20px;
            margin: 0;
            background-color: #f8f9fa;
          }
          
          .MsoNormal, p {
            margin-bottom: 16px;
            text-align: justify;
            font-size: 16px;
            line-height: 1.8;
          }
          
          * {
            text-align: justify;
          }
          
          .MsoListParagraphCxSpFirst,
          .MsoListParagraphCxSpMiddle,
          .MsoListParagraphCxSpLast {
            margin-left: 20px;
            margin-bottom: 12px;
            padding-left: 10px;
            border-left: 4px solid #ffeb44;
            background-color: #fffef5;
            padding: 12px;
            border-radius: 8px;
          }
          
          img {
            max-width: 90vw;
            height: auto;
            border-radius: 8px;
            margin: 15px 0;
          }
          
          b, strong {
            color: #234785;
            font-weight: 700;
            font-size: 18px;
          }
          
          span[style*="font-size:14.0pt"] {
            font-size: 16px !important;
          }
          
          span[style*="font-family"] {
            font-family: inherit !important;
          }
          
          /* Clean up list bullets */
          span[style*="Wingdings"] {
            display: none;
          }
          
          /* Style headers */
          .header {
            background: linear-gradient(135deg, #234785 0%, #1a3666 100%);
            color: #ffeb44;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            box-shadow: 0 2px 8px rgba(35, 71, 133, 0.2);
          }
          
          /* Style process sections */
          .process-section {
            background-color: #f0f7ff;
            border: 2px solid #234785;
            border-radius: 10px;
            padding: 15px;
            margin: 15px 0;
          }
          
          .step-item {
            background-color: #fff;
            border-radius: 8px;
            padding: 12px;
            margin: 8px 0;
            border-left: 4px solid #ffeb44;
            box-shadow: 0 2px 4px rgba(35, 71, 133, 0.1);
          }
          
          /* Remove Microsoft Office formatting */
          o\\:p { 
            display: none; 
          }
          
          /* Keyboard shortcuts styling */
          .shortcut {
            background-color: #234785;
            color: #ffeb44;
            padding: 4px 8px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 14px;
            font-weight: 600;
          }
          
          /* Clean spacing */
          * {
            margin-top: 0;
          }
          
          h1, h2, h3 {
            color: #234785;
            margin-top: 30px;
            margin-bottom: 15px;
            border-bottom: 3px solid #ffeb44;
            padding-bottom: 10px;
            font-weight: 700;
          }
          
          h1 {
            font-size: 28px;
          }
          
          h2 {
            font-size: 24px;
          }
          
          h3 {
            font-size: 20px;
          }
          
          /* Links */
          a {
            color: #234785;
            text-decoration: none;
            border-bottom: 2px solid #ffeb44;
            transition: all 0.3s ease;
          }
          
          a:hover {
            color: #1a3666;
            border-bottom-color: #ffd700;
          }
          
          /* Lists */
          ul, ol {
            padding-left: 25px;
            margin: 15px 0;
          }
          
          li {
            margin-bottom: 10px;
            color: #333;
            line-height: 1.8;
          }
          
          li::marker {
            color: #234785;
          }
          
          /* Blockquotes */
          blockquote {
            border-left: 5px solid #ffeb44;
            background-color: #fffef5;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 5px;
            font-style: italic;
            color: #555;
          }
          
          /* Tables */
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          
          th {
            background-color: #234785;
            color: #ffeb44;
            padding: 12px;
            text-align: left;
            font-weight: 700;
          }
          
          td {
            border: 1px solid #e0e0e0;
            padding: 12px;
            background-color: #fff;
          }
          
          tr:nth-child(even) td {
            background-color: #f9f9f9;
          }
          
          tr:hover td {
            background-color: #fffef5;
          }
          
          /* Code blocks */
          code {
            background-color: #234785;
            color: #ffeb44;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 14px;
          }
          
          pre {
            background-color: #234785;
            color: #ffeb44;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 15px 0;
          }
          
          pre code {
            background-color: transparent;
            padding: 0;
          }
          
          /* Dividers */
          hr {
            border: none;
            border-top: 2px solid #ffeb44;
            margin: 30px 0;
          }
          
          /* Highlights */
          mark {
            background-color: #ffeb44;
            color: #234785;
            padding: 2px 4px;
            border-radius: 3px;
          }
        </style>
      </head>
      <body>
        ${cleaned}
      </body>
      </html>
    `;

    // Further clean up the content
    return styledHTML
      .replace(/style="[^"]*"/g, "") // Remove inline styles
      .replace(/class="[^"]*"/g, "") // Remove classes
      .replace(/mso-[^;]*;?/g, "") // Remove MSO specific styles
      .replace(/<!--\[endif\]-->/g, "") // Remove conditional comments
      .replace(/&nbsp;/g, " ") // Replace non-breaking spaces
      .replace(/<o:p><\/o:p>/g, "") // Remove empty o:p tags
      .replace(/\s+/g, " ") // Clean up extra whitespace
      .replace(/<b>([^<]*Ctrl[^<]*)<\/b>/g, '<span class="shortcut">$1</span>'); // Style keyboard shortcuts
  };

  const handleBackPress = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#234785" />
        <LinearGradient
          colors={["#234785", "#1a3666"]}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color="#ffeb44" />
          <Text style={styles.loadingText}>Loading Chapter Content...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#234785" />

      {/* Header */}
      <LinearGradient colors={["#234785", "#1a3666"]} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#ffeb44" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {chapter_name}
        </Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchChapterContent}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={20} color="#ffeb44" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Content */}
      {content ? (
        <WebView
          source={{ html: content }}
          style={styles.webView}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          scalesPageToFit={false}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn("WebView error: ", nativeEvent);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn("WebView HTTP error: ", nativeEvent);
          }}
          androidLayerType="hardware"
          mixedContentMode="compatibility"
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={80} color="#234785" />
          <Text style={styles.emptyTitle}>No Content Available</Text>
          <Text style={styles.emptySubtitle}>
            This chapter doesn't have any content yet.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchChapterContent}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#ffeb44", "#ffd700"]}
              style={styles.retryGradient}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#ffeb44",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 235, 68, 0.2)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffeb44",
    flex: 1,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 235, 68, 0.2)",
  },
  webView: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#234785",
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  retryButton: {
    borderRadius: 25,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    borderWidth: 2,
    borderColor: "#234785",
  },
  retryGradient: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryText: {
    color: "#234785",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ChapterContentScreen;