"""知识库文件解析模块"""
import logging
import re
from typing import List, Dict, Optional
from pathlib import Path

logger = logging.getLogger(__name__)


class ParsedContent:
    """解析后的内容"""
    def __init__(self):
        self.text: str = ""
        self.chunks: List[str] = []
        self.metadata: Dict = {}


class BaseFileParser:
    """文件解析器基类"""
    
    SUPPORTED_EXTENSIONS = []
    
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.content = ParsedContent()
    
    def parse(self) -> ParsedContent:
        """解析文件"""
        try:
            self._parse()
            return self.content
        except Exception as e:
            logger.error(f"文件解析失败: {self.file_path}, error={str(e)}")
            self.content.metadata["parse_error"] = str(e)
            return self.content
    
    def _parse(self):
        """子类实现具体解析逻辑"""
        pass


class TextFileParser(BaseFileParser):
    """文本文件解析器"""
    
    SUPPORTED_EXTENSIONS = [".txt", ".md", ".json", ".csv"]
    
    def _parse(self):
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                self.content.text = f.read()
                self.content.metadata["file_size"] = len(self.content.text)
        except UnicodeDecodeError:
            with open(self.file_path, "r", encoding="gbk") as f:
                self.content.text = f.read()
                self.content.metadata["file_size"] = len(self.content.text)


class DocxFileParser(BaseFileParser):
    """DOCX文件解析器"""
    
    SUPPORTED_EXTENSIONS = [".docx"]
    
    def _parse(self):
        try:
            import docx
            doc = docx.Document(self.file_path)
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            self.content.text = "\n".join(paragraphs)
            self.content.metadata["paragraph_count"] = len(paragraphs)
        except ImportError:
            self.content.metadata["parse_error"] = "python-docx库未安装"
        except Exception as e:
            self.content.metadata["parse_error"] = str(e)


class PdfFileParser(BaseFileParser):
    """PDF文件解析器"""
    
    SUPPORTED_EXTENSIONS = [".pdf"]
    
    def _parse(self):
        try:
            import fitz
            doc = fitz.open(self.file_path)
            text = ""
            for page in doc:
                text += page.get_text()
            self.content.text = text
            self.content.metadata["page_count"] = len(doc)
        except ImportError:
            self.content.metadata["parse_error"] = "PyMuPDF库未安装"
        except Exception as e:
            self.content.metadata["parse_error"] = str(e)


class ExcelFileParser(BaseFileParser):
    """Excel文件解析器"""
    
    SUPPORTED_EXTENSIONS = [".xlsx", ".xls"]
    
    def _parse(self):
        try:
            import pandas as pd
            df = pd.read_excel(self.file_path)
            self.content.text = df.to_string()
            self.content.metadata["rows"] = len(df)
            self.content.metadata["columns"] = len(df.columns)
        except ImportError:
            self.content.metadata["parse_error"] = "pandas库未安装"
        except Exception as e:
            self.content.metadata["parse_error"] = str(e)


class ContentChunker:
    """内容分片器"""
    
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def chunk(self, text: str) -> List[str]:
        """将文本切分为多个chunk"""
        if not text:
            return []
        
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = min(start + self.chunk_size, text_length)
            
            if end < text_length:
                last_period = text.rfind(".", start, end)
                last_newline = text.rfind("\n", start, end)
                last_space = text.rfind(" ", start, end)
                
                split_pos = max(last_period, last_newline, last_space)
                if split_pos > start + self.chunk_size // 2:
                    end = split_pos + 1
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            start = end - self.chunk_overlap
            if start <= 0:
                start = end
        
        return chunks
    
    def chunk_with_metadata(self, text: str, base_metadata: Dict = None) -> List[Dict]:
        """将文本切分为带元数据的chunk"""
        chunks = self.chunk(text)
        result = []
        
        for i, chunk in enumerate(chunks):
            metadata = {
                "chunk_index": i,
                "total_chunks": len(chunks),
                "chunk_length": len(chunk)
            }
            if base_metadata:
                metadata.update(base_metadata)
            
            result.append({
                "content": chunk,
                "metadata": metadata
            })
        
        return result


class FileParserFactory:
    """文件解析器工厂"""
    
    PARSERS = {
        ".txt": TextFileParser,
        ".md": TextFileParser,
        ".json": TextFileParser,
        ".csv": TextFileParser,
        ".docx": DocxFileParser,
        ".pdf": PdfFileParser,
        ".xlsx": ExcelFileParser,
        ".xls": ExcelFileParser
    }
    
    @classmethod
    def create_parser(cls, file_path: str) -> Optional[BaseFileParser]:
        """创建文件解析器"""
        ext = Path(file_path).suffix.lower()
        
        if ext not in cls.PARSERS:
            logger.error(f"不支持的文件类型: {ext}")
            return None
        
        parser_class = cls.PARSERS[ext]
        return parser_class(file_path)
    
    @classmethod
    def get_supported_extensions(cls) -> List[str]:
        """获取支持的文件扩展名列表"""
        return list(cls.PARSERS.keys())