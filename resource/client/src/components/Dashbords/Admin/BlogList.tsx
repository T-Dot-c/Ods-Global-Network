import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BASE_URL from "../../../api/api";

type BlogPost = {
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  createdAt: string;
};

const BlogList = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/posts`)
      .then(async (res) => {
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Fetch failed: ${res.status} ${errText}`);
        }
        return res.json();
      })
      .then((data) => setPosts(data))
      .catch((err) => console.error("Error fetching blog posts", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto mt-12 px-4">
      <h2 className="text-3xl font-bold text-center mb-8 text-[#1c2b21]">Latest Blog Posts</h2>

      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : posts.length === 0 ? (
        <p className="text-center text-gray-500">No blog posts found.</p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2">
          {posts.map((post) => (
            <div key={post.slug} className="bg-white rounded-lg shadow-lg overflow-hidden">
              {post.coverImage && (
                <img
                   src={`${BASE_URL.replace("/api", "")}${post.coverImage}`}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2 text-[#1c2b21]">{post.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                <p className="text-sm text-gray-400 mb-2">
                  Posted on {new Date(post.createdAt).toLocaleDateString()}
                </p>
                <Link
                  to={`/blog/${post.slug}`}
                  className="text-[#D4AF37] font-medium hover:underline"
                >
                  Read More →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogList;


